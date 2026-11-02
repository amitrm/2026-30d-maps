"""Station order along each 'L' line, from CTA's GTFS schedule feed.

Run from the repository root to refresh ``reference/cta-line-sequences.json``::

    uv run python -m atlas.gtfs            # reuse the latest feed in reference/raw/gtfs/
    uv run python -m atlas.gtfs --refresh  # download a new feed first

Each line is a list of segments of station ids (``map_id``, the GTFS ``parent_station``). The first
segment is the line's longest scheduled pattern, terminal to terminal; any further segment is a
branch whose stations the main pattern skips (Green's Ashland/63rd and Cottage Grove branches).
Segments start at the outer terminal: the end farther from State & Madison, or, for lines with two
outer ends, the north or west end. The feed is large and stays out of git; the JSON is committed.
"""

from __future__ import annotations

import argparse
import json
import logging
import zipfile
from collections import Counter
from datetime import date
from pathlib import Path

import pandas as pd
import requests

from atlas.grid import to_address

log = logging.getLogger(__name__)

FEED_URL = 'https://www.transitchicago.com/downloads/sch_data/google_transit.zip'
RAW_DIR = Path('reference') / 'raw' / 'gtfs'
OUT_PATH = Path('reference') / 'cta-line-sequences.json'
ROUTES = {'Red': 'Red', 'Blue': 'Blue', 'Brn': 'Brown', 'G': 'Green', 'Org': 'Orange',
          'P': 'Purple', 'Pink': 'Pink', 'Y': 'Yellow'}
LOOP_RADIUS = 1200  # address units; a terminal this close to State & Madison is the Loop end


def feed(refresh: bool = False) -> tuple[Path, date]:
    """Return the latest dated feed zip, downloading a new one if asked or if none exists."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    existing = sorted(RAW_DIR.glob('cta_gtfs_*.zip'))
    if refresh or not existing:
        pulled = date.today()
        path = RAW_DIR / f'cta_gtfs_{pulled.isoformat()}.zip'
        with requests.get(FEED_URL, stream=True, timeout=120) as resp:
            resp.raise_for_status()
            with path.open('wb') as f:
                for chunk in resp.iter_content(1 << 20):
                    f.write(chunk)
        log.info('Saved new feed %s', path.name)
        return path, pulled
    path = existing[-1]
    return path, date.fromisoformat(path.stem.rsplit('_', 1)[-1])


def patterns(zip_path: Path) -> tuple[dict[str, Counter], pd.DataFrame]:
    """Distinct station sequences per line (with trip counts), and the station table."""
    z = zipfile.ZipFile(zip_path)
    trips = pd.read_csv(z.open('trips.txt'), dtype=str, usecols=['route_id', 'trip_id'])
    trips = trips[trips['route_id'].isin(ROUTES)]
    stops = pd.read_csv(z.open('stops.txt'), dtype=str,
                        usecols=['stop_id', 'stop_name', 'stop_lat', 'stop_lon', 'parent_station'])
    parent = stops.dropna(subset=['parent_station']).set_index('stop_id')['parent_station']

    wanted = set(trips['trip_id'])
    parts = []
    for chunk in pd.read_csv(z.open('stop_times.txt'), dtype=str, chunksize=2_000_000,
                             usecols=['trip_id', 'stop_id', 'stop_sequence']):
        parts.append(chunk[chunk['trip_id'].isin(wanted)])
    st = pd.concat(parts)
    st['stop_sequence'] = st['stop_sequence'].astype(int)
    st['station'] = st['stop_id'].map(parent)
    assert st['station'].notna().all(), 'A rail stop has no parent station'
    st = st.sort_values(['trip_id', 'stop_sequence']).merge(trips, on='trip_id')

    found: dict[str, Counter] = {name: Counter() for name in ROUTES.values()}
    for (route, _), g in st.groupby(['route_id', 'trip_id'], sort=False):
        seq = []
        for s in g['station']:
            if s not in seq:  # Loop circuits revisit stations; keep the first visit
                seq.append(s)
        found[ROUTES[route]][tuple(seq)] += 1
    stations = stops[stops['stop_id'].isin(st['station'].unique())].set_index('stop_id')
    return found, stations


def build(found: dict[str, Counter], stations: pd.DataFrame) -> dict[str, list[list[str]]]:
    """Main pattern plus branch segments for each line, oriented from the outer terminal."""
    x, y = to_address(stations['stop_lat'].astype(float), stations['stop_lon'].astype(float))
    pos = pd.DataFrame({'x': x, 'y': y}, index=stations.index)

    def outer_first(seq: list[str]) -> list[str]:
        a, b = pos.loc[seq[0]], pos.loc[seq[-1]]
        near_a, near_b = (abs(p.x) + abs(p.y) < LOOP_RADIUS * 2 for p in (a, b))
        if near_a != near_b:
            return list(reversed(seq)) if near_a else seq
        return seq if (a.y - a.x) >= (b.y - b.x) else list(reversed(seq))

    lines = {}
    for line, pats in found.items():
        main = outer_first(list(max(pats, key=lambda p: (len(p), pats[p]))))
        segments, seen = [main], set(main)
        for pat in sorted(pats, key=lambda p: -pats[p]):
            run = []
            for s in list(pat) + [None]:
                if s is not None and s not in seen:
                    run.append(s)
                elif run:
                    segments.append(outer_first(run) if len(run) > 1 else run)
                    seen.update(run)
                    run = []
        lines[line] = segments
    return lines


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--refresh', action='store_true', help='download a new feed first')
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format='%(levelname)s %(name)s: %(message)s')

    path, pulled = feed(args.refresh)
    found, stations = patterns(path)
    lines = build(found, stations)
    names = stations['stop_name'].to_dict()
    for line, segs in lines.items():
        log.info('%s: %d stations in %d segment(s): %s ... %s', line, sum(map(len, segs)), len(segs),
                 names[segs[0][0]], names[segs[0][-1]])
    feed_date = max(date(*i.date_time[:3]) for i in zipfile.ZipFile(path).infolist()
                    if i.filename == 'stop_times.txt')
    OUT_PATH.write_text(json.dumps({
        'source': 'CTA GTFS schedule feed',
        'url': FEED_URL,
        'pulled': pulled.isoformat(),
        'feed_date': feed_date.isoformat(),
        'note': 'Station ids are map_id; first segment is the main pattern, the rest are branches.',
        'lines': lines,
    }, indent=1))
    log.info('Wrote %s', OUT_PATH)


if __name__ == '__main__':
    main()
