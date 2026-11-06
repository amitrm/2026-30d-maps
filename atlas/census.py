"""Chicago residents by 2020 Census block, a shared reference layer for the access plates.

Run from the repository root to rebuild ``reference/chicago-blocks-2020.csv``::

    uv run python -m atlas.census

Sources, all keyless bulk files:

- 2020 Census Redistricting Data (P.L. 94-171), Illinois geographic header: block population
  (POP100) and internal point (INTPTLAT/INTPTLON). ``reference/raw/census/il2020.pl.zip``.
  City membership is the Census place code for Chicago (14000).
- Chicago Data Portal, Boundaries - Census Blocks - 2020 (3aji-w8h2): community area and ward. The
  portal's block list differs from the Census place at the city edge by a few dozen blocks
  (under 100 residents); blocks it lacks get community area and ward 0.
- ACS 2020-2024 5-year, tables B18105 (ambulatory difficulty) and B18103 (vision difficulty), tract
  level, table-based summary files. ``reference/raw/census/acsdt5y2024-b1810{5,3}.dat``.

Blocks with no residents are left out. Tract difficulty counts are allocated to blocks in
proportion to 2020 population, so block values are estimates for aggregation, not block facts.
"""

from __future__ import annotations

import io
import logging
import zipfile
from datetime import date
from pathlib import Path

import pandas as pd
import requests

from atlas.socrata import fetch

log = logging.getLogger(__name__)

RAW_DIR = Path('reference') / 'raw' / 'census'
OUT_PATH = Path('reference') / 'chicago-blocks-2020.csv'
PL_URL = ('https://www2.census.gov/programs-surveys/decennial/2020/data/'
          '01-Redistricting_File--PL_94-171/Illinois/il2020.pl.zip')
ACS_URL = ('https://www2.census.gov/programs-surveys/acs/summary_file/2024/table-based-SF/data/'
           '5YRData/acsdt5y2024-{table}.dat')
BLOCKS_ID = '3aji-w8h2'  # Boundaries - Census Blocks - 2020
CHICAGO_POP_2020 = 2_746_388

# P.L. 94-171 geographic header, 1-based field numbers
GEO = {'SUMLEV': 3, 'GEOID': 10, 'COUNTY': 15, 'PLACE': 30, 'POP100': 91, 'INTPTLAT': 93,
       'INTPTLON': 94}
CHICAGO_PLACE = '14000'
# B18105 'With an ambulatory difficulty' cells: male then female, ages 5-17, 18-34, 35-64, 65-74, 75+
AMBULATORY = [4, 7, 10, 13, 16, 20, 23, 26, 29, 32]
AMBULATORY_65 = [13, 16, 29, 32]
# B18103 'With a vision difficulty' cells: male then female, ages under 5, 5-17, 18-34, 35-64, 65-74, 75+
VISION = [4, 7, 10, 13, 16, 19, 23, 26, 29, 32, 35, 38]
VISION_65 = [16, 19, 35, 38]


def _download(url: str, path: Path) -> Path:
    if not path.exists():
        RAW_DIR.mkdir(parents=True, exist_ok=True)
        log.info('Downloading %s', url)
        with requests.get(url, stream=True, timeout=120) as resp:
            resp.raise_for_status()
            with path.open('wb') as f:
                for chunk in resp.iter_content(1 << 20):
                    f.write(chunk)
    return path


def pl_blocks() -> pd.DataFrame:
    """Cook County blocks from the P.L. 94-171 header: geoid, population, internal point, in Chicago."""
    path = _download(PL_URL, RAW_DIR / 'il2020.pl.zip')
    with zipfile.ZipFile(path) as z, z.open('ilgeo2020.pl') as f:
        rows = []
        for line in io.TextIOWrapper(f, encoding='latin-1'):
            v = line.split('|')
            if v[GEO['SUMLEV'] - 1] == '750' and v[GEO['COUNTY'] - 1] == '031':
                rows.append((v[GEO['GEOID'] - 1], int(v[GEO['POP100'] - 1]),
                             float(v[GEO['INTPTLAT'] - 1]), float(v[GEO['INTPTLON'] - 1]),
                             v[GEO['PLACE'] - 1] == CHICAGO_PLACE))
    return pd.DataFrame(rows, columns=['geoid', 'pop', 'lat', 'lon', 'chicago'])


def _tracts(table: str) -> tuple[pd.DataFrame, callable]:
    path = _download(ACS_URL.format(table=table), RAW_DIR / f'acsdt5y2024-{table}.dat')
    acs = pd.read_csv(path, sep='|', dtype=str)
    acs = acs[acs['GEO_ID'].str.startswith('1400000US17031')]
    num = lambda cells: sum(pd.to_numeric(acs[f'{table.upper()}_E{c:03d}']) for c in cells)
    return acs, num


def tract_ambulatory() -> pd.DataFrame:
    """Cook County tracts: civilian population 5+, with an ambulatory difficulty, and of those 65+."""
    acs, num = _tracts('b18105')
    return pd.DataFrame({
        'tract': acs['GEO_ID'].str[-11:].values,
        'pop5': pd.to_numeric(acs['B18105_E001']).values,
        'amb': num(AMBULATORY).values,
        'amb65': num(AMBULATORY_65).values,
    })


def tract_vision() -> pd.DataFrame:
    """Cook County tracts: civilian population with a vision difficulty, and of those 65+."""
    acs, num = _tracts('b18103')
    return pd.DataFrame({
        'tract': acs['GEO_ID'].str[-11:].values,
        'vis': num(VISION).values,
        'vis65': num(VISION_65).values,
    })


def build() -> pd.DataFrame:
    """Chicago blocks with residents: population, internal point, community area, ward, estimates."""
    cook = pl_blocks()
    cook['tract'] = cook['geoid'].str[:11]
    tract_pop = cook.groupby('tract')['pop'].sum()  # whole tract, so edge tracts are not over-allocated
    city = fetch(BLOCKS_ID, select='block_full,commarea,ward')
    blocks = cook[cook['chicago']].drop(columns='chicago').merge(city.rename(columns={'block_full': 'geoid'}), on='geoid', how='left',
                               validate='one_to_one')
    missing = blocks['commarea'].isna()
    log.info('Blocks without portal attributes: %d (%d residents)', missing.sum(),
             blocks.loc[missing, 'pop'].sum())
    assert blocks['pop'].sum() == CHICAGO_POP_2020, f'Population {blocks["pop"].sum():,} != 2020 count'

    tracts = tract_ambulatory()
    share = blocks['pop'] / blocks['tract'].map(tract_pop)
    blocks = blocks.merge(tracts[['tract', 'amb', 'amb65']], on='tract', how='left')
    blocks = blocks.merge(tract_vision(), on='tract', how='left')
    for col in ('amb', 'amb65', 'vis', 'vis65'):
        blocks[col] = (blocks[col].fillna(0) * share.fillna(0)).round(2)
    blocks = blocks[blocks['pop'] > 0].copy()
    for col in ('commarea', 'ward'):
        blocks[col] = pd.to_numeric(blocks[col]).fillna(0).astype(int)
    return blocks[['geoid', 'pop', 'lat', 'lon', 'commarea', 'ward', 'amb', 'amb65', 'vis', 'vis65']]


def main() -> None:
    logging.basicConfig(level=logging.INFO, format='%(levelname)s %(name)s: %(message)s')
    blocks = build()
    blocks.to_csv(OUT_PATH, index=False)
    log.info('Wrote %s: %d blocks, %s residents, ~%s with an ambulatory difficulty, ~%s with a vision '
             'difficulty (built %s)', OUT_PATH, len(blocks), f'{blocks["pop"].sum():,}',
             f'{blocks["amb"].sum():,.0f}', f'{blocks["vis"].sum():,.0f}', date.today())


if __name__ == '__main__':
    main()
