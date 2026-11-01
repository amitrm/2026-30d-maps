"""Chicago Data Portal (Socrata SODA API) access with dated, cached snapshots.

Every notebook reads its source data through :func:`snapshot`, which saves a dated CSV under the
day's ``data/raw/`` folder. Re-running a notebook reuses the latest snapshot unless a refresh is
requested, so published figures can always be reproduced from the committed raw file.
"""

from __future__ import annotations

import logging
import os
import time
from datetime import date
from pathlib import Path

import pandas as pd
import requests

log = logging.getLogger(__name__)

BASE_URL = 'https://data.cityofchicago.org/resource'
PAGE_SIZE = 50_000
TIMEOUT_S = 60
MAX_RETRIES = 4


def _get(url: str, params: dict[str, str | int]) -> list[dict]:
    """GET one page of JSON rows, retrying on throttling and transient server errors."""
    headers = {}
    if token := os.environ.get('SOCRATA_APP_TOKEN'):
        headers['X-App-Token'] = token
    for attempt in range(1, MAX_RETRIES + 1):
        resp = requests.get(url, params=params, headers=headers, timeout=TIMEOUT_S)
        if resp.status_code in (429, 500, 502, 503, 504) and attempt < MAX_RETRIES:
            wait = 2**attempt
            log.warning('HTTP %s from portal, retrying in %ss', resp.status_code, wait)
            time.sleep(wait)
            continue
        resp.raise_for_status()
        return resp.json()
    raise RuntimeError(f'Portal request failed after {MAX_RETRIES} attempts: {url}')


def fetch(dataset_id: str, select: str | None = None, where: str | None = None,
          order: str = ':id') -> pd.DataFrame:
    """Download every row of a dataset (paged) and flatten nested fields.

    Point columns such as ``location`` arrive as objects and are flattened to
    ``location.latitude`` / ``location.longitude``.
    """
    url = f'{BASE_URL}/{dataset_id}.json'
    params: dict[str, str | int] = {'$limit': PAGE_SIZE, '$order': order}
    if select:
        params['$select'] = select
    if where:
        params['$where'] = where

    rows: list[dict] = []
    offset = 0
    while True:
        page = _get(url, {**params, '$offset': offset})
        rows.extend(page)
        log.info('%s: fetched %d rows (total %d)', dataset_id, len(page), len(rows))
        if len(page) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return pd.json_normalize(rows)


def snapshot(dataset_id: str, raw_dir: Path, name: str, *, refresh: bool = False,
             **query: str) -> tuple[pd.DataFrame, date]:
    """Return the latest dated snapshot ``<name>_YYYY-MM-DD.csv``, fetching a new one if asked.

    Returns the data and the date it was pulled, which goes into the plate's data ledger.
    """
    raw_dir.mkdir(parents=True, exist_ok=True)
    existing = sorted(raw_dir.glob(f'{name}_*.csv'))

    if refresh or not existing:
        df = fetch(dataset_id, **query)
        pulled = date.today()
        path = raw_dir / f'{name}_{pulled.isoformat()}.csv'
        df.to_csv(path, index=False)
        log.info('Saved new snapshot %s (%d rows)', path.name, len(df))
        return df, pulled

    path = existing[-1]
    pulled = date.fromisoformat(path.stem.rsplit('_', 1)[-1])
    log.info('Using cached snapshot %s', path.name)
    return pd.read_csv(path, dtype=str), pulled
