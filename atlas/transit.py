"""Door-to-door transit times from many origins: a connection scan over CTA, Metra and Pace GTFS.

The same model as Plate XV: every scheduled hop between consecutive stops of a trip (a connection),
scanned in departure order from a start time. Walking is a straight line stretched by ``DETOUR`` at
``WALK_MPS``: to a stop within ``ACCESS`` miles at the start, between stops within ``TRANSFER`` miles
(plus a minute) on the way, and from a stop within ``ACCESS`` miles at the end. No fares, no crowding,
no missed transfers: the schedule as published.

Coordinates are miles east and north of State & Madison (:func:`atlas.grid.miles_from_origin`).
"""

from __future__ import annotations

import logging
import zipfile
from datetime import date
from multiprocessing import get_context
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.spatial import cKDTree

from atlas.grid import miles_from_origin

log = logging.getLogger(__name__)

WALK_MPS = 1.2           # walking speed, meters per second
DETOUR = 1.3             # straight line to street distance
ACCESS = 0.75            # miles: longest walk to the first stop or from the last
TRANSFER = 0.25          # miles: longest walk between stops on a transfer
TRANSFER_S = 60          # seconds added to every transfer walk
WALK = WALK_MPS / DETOUR / 1609.344  # miles of straight line per second


def _read(z: zipfile.ZipFile, name: str, **kw) -> pd.DataFrame:
    df = pd.read_csv(z.open(name), dtype=str, skipinitialspace=True, **kw)
    df.columns = df.columns.str.strip()
    return df


def service_ids(z: zipfile.ZipFile, day: date) -> set[str]:
    """Service ids active on ``day`` (tolerates the padded headers of the Metra and Pace feeds)."""
    cal = _read(z, 'calendar.txt')
    stamp, wd = day.strftime('%Y%m%d'), day.strftime('%A').lower()
    ids = set(cal[(cal['start_date'] <= stamp) & (cal['end_date'] >= stamp) & (cal[wd] == '1')]['service_id'])
    exc = _read(z, 'calendar_dates.txt')
    exc = exc[exc['date'] == stamp]
    ids |= set(exc.loc[exc['exception_type'] == '1', 'service_id'])
    ids -= set(exc.loc[exc['exception_type'] == '2', 'service_id'])
    return ids


def _seconds(s: pd.Series) -> pd.Series:
    p = s.str.strip().str.split(':', expand=True).astype(int)
    return p[0] * 3600 + p[1] * 60 + p[2]


def connections(feeds: dict[str, Path], day: date, t0: int, t1: int) -> dict[str, np.ndarray]:
    """Every connection of ``day`` departing between ``t0`` and ``t1`` (seconds after midnight).

    ``feeds`` maps a one-letter prefix (kept on stop ids) to a GTFS zip. Returns ``conn`` (dep, arr,
    from stop, to stop, trip) sorted by departure, stop positions ``x``, ``y`` in miles and ``stop_id``.
    """
    stops, conns = [], []
    for k, path in feeds.items():
        z = zipfile.ZipFile(path)
        st = _read(z, 'stops.txt', usecols=['stop_id', 'stop_lat', 'stop_lon'])
        st['stop_id'] = k + st['stop_id']
        stops.append(st)
        trips = _read(z, 'trips.txt', usecols=['service_id', 'trip_id'])
        want = set(trips.loc[trips['service_id'].isin(service_ids(z, day)), 'trip_id'])
        rows = []
        for ch in pd.read_csv(z.open('stop_times.txt'), dtype=str, skipinitialspace=True, chunksize=2_000_000,
                              usecols=['trip_id', 'arrival_time', 'departure_time', 'stop_id', 'stop_sequence']):
            ch.columns = ch.columns.str.strip()
            ch = ch[ch['trip_id'].isin(want)].dropna(subset=['departure_time'])
            ch = ch.assign(dep=_seconds(ch['departure_time']), arr=_seconds(ch['arrival_time']))
            rows.append(ch[(ch['dep'] >= t0 - 3600) & (ch['dep'] <= t1)])
        r = pd.concat(rows)
        r['seq'] = r['stop_sequence'].astype(int)
        r = r.sort_values(['trip_id', 'seq'])
        nxt = r.shift(-1)
        ok = nxt['trip_id'] == r['trip_id']
        conns.append(pd.DataFrame({'trip': k + r['trip_id'][ok], 'a': k + r['stop_id'][ok],
                                   'b': k + nxt['stop_id'][ok], 'dep': r['dep'][ok], 'arr': nxt['arr'][ok]}))
        log.info('%s: %d trips on %s', path.name, len(want), day)
    st = pd.concat(stops).drop_duplicates('stop_id').reset_index(drop=True)
    idx = {s: i for i, s in enumerate(st['stop_id'])}
    c = pd.concat(conns)
    c = c[c['a'].isin(idx) & c['b'].isin(idx)]
    tid = {t: i for i, t in enumerate(c['trip'].unique())}
    conn = np.column_stack([c['dep'], c['arr'], c['a'].map(idx), c['b'].map(idx), c['trip'].map(tid)]).astype(np.int64)
    conn = conn[np.argsort(conn[:, 0], kind='stable')]
    x, y = miles_from_origin(st['stop_lat'].astype(float).to_numpy(), st['stop_lon'].astype(float).to_numpy())
    return {'conn': conn, 'x': x, 'y': y, 'stop_id': st['stop_id'].to_numpy()}


_G: dict = {}


def _scan(start: int, origin_walk: list[tuple[int, float]], horizon: int) -> np.ndarray:
    """Earliest arrival (seconds) at every stop, leaving the origin at ``start``."""
    conn, fp = _G['conn'], _G['fp']
    best = [np.inf] * len(fp)
    for s, w in origin_walk:
        best[s] = start + w
    reached = bytearray(_G['ntrip'])
    lo = int(np.searchsorted(conn[:, 0], start))
    end = start + horizon
    for dep, arr, a, b, t in conn[lo:].tolist():
        if dep > end:
            break
        if reached[t] or best[a] <= dep:
            reached[t] = 1
            if arr < best[b] and arr <= end:
                best[b] = arr
                for n, w in fp[b]:
                    if arr + w < best[n]:
                        best[n] = arr + w
    return np.array(best)


def _reach_one(i: int) -> list[float]:
    o = _G['origins'][i]
    pts, horizon = _G['pts'], _G['horizon']
    ow = [(s, float(np.hypot(*(pts[s] - o)) / WALK)) for s in _G['tree'].query_ball_point(o, ACCESS)]
    pa, pb, pw = _G['pairs']
    direct = np.hypot(*(_G['dest'] - o).T) / WALK
    out = []
    for start in _G['starts']:
        best = _scan(start, ow, horizon) - start
        t = np.full(len(_G['dest']), np.inf)
        np.minimum.at(t, pa, best[pb] + pw)
        t = np.minimum(t, direct)
        out.append(float(_G['weight'][t <= horizon].sum()))
    return out


def reach(net: dict[str, np.ndarray], origins: np.ndarray, dest: np.ndarray, weight: np.ndarray,
          starts: list[int], horizon: int, processes: int = 8) -> np.ndarray:
    """Weight (e.g. jobs) at ``dest`` points reachable within ``horizon`` seconds door to door.

    One row per origin, one column per start time. ``origins`` and ``dest`` are (n, 2) arrays in
    miles. Runs the scans in ``processes`` forked worker processes.
    """
    pts = np.column_stack([net['x'], net['y']])
    tree = cKDTree(pts)
    fp: list[list[tuple[int, float]]] = [[] for _ in range(len(pts))]
    for i, j in tree.query_pairs(TRANSFER):
        w = float(np.hypot(*(pts[i] - pts[j])) / WALK + TRANSFER_S)
        fp[i].append((j, w))
        fp[j].append((i, w))
    near = tree.query_ball_point(dest, ACCESS)
    pa = np.repeat(np.arange(len(dest)), [len(n) for n in near])
    pb = np.fromiter((s for n in near for s in n), dtype=np.int64, count=len(pa))
    pw = np.hypot(*(pts[pb] - dest[pa]).T) / WALK
    _G.update(conn=net['conn'], fp=fp, ntrip=int(net['conn'][:, 4].max()) + 1, pts=pts, tree=tree,
              origins=origins, dest=dest, weight=weight, pairs=(pa, pb, pw), starts=starts, horizon=horizon)
    with get_context('fork').Pool(processes) as pool:
        rows = pool.map(_reach_one, range(len(origins)), chunksize=4)
    return np.array(rows)
