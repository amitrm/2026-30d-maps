"""Live feeds saved as timestamped snapshots.

A live feed has no history, so every pull is kept: ``raw_dir/<name>_YYYY-MM-DDTHHMM.json`` (Chicago
time). Notebooks read the snapshot they were run on, never the feed, so a plate can be rebuilt from
the committed file. Used from Day 07 (CTA elevator outages).

    uv run python -m atlas.live days/day07-10min/data/raw              # one full CTA alerts pull
    uv run python -m atlas.live days/day07-10min/data/log --elevators  # elevator alerts only
"""

from __future__ import annotations

import json
import logging
import sys
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests

log = logging.getLogger(__name__)

CHICAGO = ZoneInfo('America/Chicago')
CTA_ALERTS_URL = 'https://www.transitchicago.com/api/1.0/alerts.aspx'
CTA_ALERTS_PARAMS = {'outputType': 'JSON', 'activeonly': 'true'}
STAMP = '%Y-%m-%dT%H%M'
TIMEOUT_S = 30
MAX_RETRIES = 4


def pull(url: str, raw_dir: Path, name: str, params: dict | None = None,
         keep=None) -> tuple[dict, datetime]:
    """GET a JSON feed now and save it as ``<name>_<stamp>.json``; returns (data, pulled at).

    ``keep`` optionally trims the response before saving (for frequent, compact logs).
    """
    raw_dir = Path(raw_dir)
    raw_dir.mkdir(parents=True, exist_ok=True)
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.get(url, params=params, timeout=TIMEOUT_S,
                                headers={'User-Agent': '800-to-the-mile atlas'})
            resp.raise_for_status()
            data = resp.json()
            if keep:
                data = keep(data)
            break
        except (requests.RequestException, ValueError):
            if attempt == MAX_RETRIES:
                raise
            time.sleep(2**attempt)
    at = datetime.now(CHICAGO).replace(second=0, microsecond=0)
    path = raw_dir / f'{name}_{at.strftime(STAMP)}.json'
    path.write_text(json.dumps({'pulledAt': at.isoformat(), 'url': resp.url, 'data': data}, indent=1))
    log.info('Saved %s', path)
    return data, at


def snapshots(raw_dir: Path, name: str) -> list[Path]:
    """All saved pulls of a feed, oldest first."""
    return sorted(Path(raw_dir).glob(f'{name}_*.json'))


def read(path: Path) -> tuple[dict, datetime]:
    """(data, pulled at) of a saved pull."""
    doc = json.loads(Path(path).read_text())
    return doc['data'], datetime.fromisoformat(doc['pulledAt'])


def elevator_alerts(data: dict) -> list[dict]:
    """The active alerts whose impact is an elevator outage."""
    alerts = data['CTAAlerts'].get('Alert') or []
    if isinstance(alerts, dict):  # the feed returns a bare object when there is one alert
        alerts = [alerts]
    return [a for a in alerts if a.get('Impact') == 'Elevator Status']


LOG_FIELDS = ('AlertId', 'Headline', 'ShortDescription', 'EventStart', 'EventEnd', 'ImpactedService')


def compact(alert: dict) -> dict:
    """An elevator alert without its HTML description, for the hourly log."""
    return {k: alert.get(k) for k in LOG_FIELDS}


def pull_cta_alerts(raw_dir: Path, elevators_only: bool = False) -> tuple[dict, datetime]:
    """Active CTA customer alerts (no key needed); the hourly log keeps elevator alerts only."""
    if elevators_only:
        return pull(CTA_ALERTS_URL, raw_dir, 'cta_elevators', CTA_ALERTS_PARAMS,
                    keep=lambda d: {'Elevator': [compact(a) for a in elevator_alerts(d)]})
    return pull(CTA_ALERTS_URL, raw_dir, 'cta_alerts', CTA_ALERTS_PARAMS)


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='%(levelname)s %(name)s: %(message)s')
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    pull_cta_alerts(Path(args[0]) if args else Path('days/day07-10min/data/raw'),
                    elevators_only='--elevators' in sys.argv)
