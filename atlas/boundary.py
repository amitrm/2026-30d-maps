"""The City of Chicago boundary in address units, a shared reference layer for every plate.

Run from the repository root to refresh ``reference/city-boundary.json``::

    uv run python -m atlas.boundary            # reuse the latest raw snapshot
    uv run python -m atlas.boundary --refresh  # pull a new one from the portal

Rings are projected with :func:`atlas.grid.to_address` and simplified (Douglas-Peucker) to a
tolerance well below one pixel on a plate. Holes are kept: they are the suburbs Chicago surrounds.
"""

from __future__ import annotations

import argparse
import json
import logging
from datetime import date
from pathlib import Path

import numpy as np
import requests

from atlas.grid import to_address

log = logging.getLogger(__name__)

DATASET_ID = 'qqq8-j68g'  # Boundaries - City
DATASET_NAME = 'Boundaries - City'
DATASET_URL = f'https://data.cityofchicago.org/d/{DATASET_ID}'
GEOJSON_URL = f'https://data.cityofchicago.org/resource/{DATASET_ID}.geojson'

REF_DIR = Path('reference')
RAW_DIR = REF_DIR / 'raw'
OUT_PATH = REF_DIR / 'city-boundary.json'
TOLERANCE = 15  # address units; 800 = one mile, so about 100 ft


def snapshot(refresh: bool = False) -> tuple[dict, date]:
    """Return the latest dated GeoJSON snapshot, downloading a new one if asked or if none exists."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    existing = sorted(RAW_DIR.glob('city_boundary_*.geojson'))
    if refresh or not existing:
        resp = requests.get(GEOJSON_URL, timeout=60)
        resp.raise_for_status()
        pulled = date.today()
        path = RAW_DIR / f'city_boundary_{pulled.isoformat()}.geojson'
        path.write_text(resp.text)
        log.info('Saved new snapshot %s', path.name)
    else:
        path = existing[-1]
        pulled = date.fromisoformat(path.stem.rsplit('_', 1)[-1])
        log.info('Using cached snapshot %s', path.name)
    return json.loads(path.read_text()), pulled


def simplify(points: np.ndarray, tolerance: float) -> np.ndarray:
    """Douglas-Peucker simplification of an (n, 2) polyline; keeps both endpoints."""
    keep = np.zeros(len(points), dtype=bool)
    keep[[0, -1]] = True
    stack = [(0, len(points) - 1)]
    while stack:
        start, end = stack.pop()
        if end - start < 2:
            continue
        a, b = points[start], points[end]
        seg = points[start + 1:end]
        ab = b - a
        norm = np.hypot(*ab)
        if norm == 0:
            dist = np.hypot(*(seg - a).T)
        else:
            dist = np.abs(ab[0] * (seg[:, 1] - a[1]) - ab[1] * (seg[:, 0] - a[0])) / norm
        i = int(np.argmax(dist))
        if dist[i] > tolerance:
            mid = start + 1 + i
            keep[mid] = True
            stack += [(start, mid), (mid, end)]
    return points[keep]


def project_rings(geojson: dict, tolerance: float = TOLERANCE) -> list[list[list[int]]]:
    """Every ring of the boundary multipolygon, in address units, simplified and rounded."""
    rings = []
    for feature in geojson['features']:
        geom = feature['geometry']
        polygons = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
        for polygon in polygons:
            for ring in polygon:
                lonlat = np.asarray(ring, dtype=float)
                x, y = to_address(lonlat[:, 1], lonlat[:, 0])
                pts = simplify(np.column_stack([x, y]), tolerance)
                if len(pts) >= 4:
                    rings.append(np.round(pts).astype(int).tolist())
    return rings


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--refresh', action='store_true', help='pull a new snapshot from the portal')
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format='%(levelname)s %(name)s: %(message)s')

    geojson, pulled = snapshot(args.refresh)
    rings = project_rings(geojson)
    n_in = sum(len(r) for f in geojson['features'] for p in f['geometry']['coordinates'] for r in p)
    n_out = sum(len(r) for r in rings)
    assert rings, 'No rings survived simplification'
    log.info('Boundary: %d rings, %d -> %d vertices (tolerance %s)', len(rings), n_in, n_out, TOLERANCE)

    OUT_PATH.write_text(json.dumps({
        'source': DATASET_NAME,
        'dataset_id': DATASET_ID,
        'url': DATASET_URL,
        'pulled': pulled.isoformat(),
        'units': 'Chicago address units (x east, y north of State & Madison)',
        'tolerance': TOLERANCE,
        'rings': rings,
    }, separators=(',', ':')))
    log.info('Wrote %s (%d bytes)', OUT_PATH, OUT_PATH.stat().st_size)


if __name__ == '__main__':
    main()
