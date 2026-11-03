"""Walking networks from OpenStreetMap and network walksheds, shared by the access plates.

The network comes from a dated Geofabrik extract of Illinois, cut with ``osmium`` to the city limits
plus a buffer and filtered with OSMnx's own ``walk`` rules, so it matches what OSMnx would download
from Overpass. A step-free variant drops stairs and ways tagged ``wheelchair=no``.

Distances are network meters in UTM zone 16N (EPSG:26916). :func:`reach` runs one multi-source
Dijkstra and returns, for every node, the distance to the nearest source and which source that is,
so one run gives both walksheds and station catchments. :func:`reached` and :func:`shed` turn the
result into polygons; :func:`to_rings` converts them to address units for the plates.

Shared by Day 03 (walksheds) and the later access plates; the network is cached beside the extract.
"""

from __future__ import annotations

import logging
import shutil
import subprocess
from dataclasses import dataclass
from datetime import date
from pathlib import Path

import geopandas as gpd
import networkx as nx
import numpy as np
import osmnx as ox
import pandas as pd
import shapely
from scipy.sparse import csr_array
from scipy.sparse.csgraph import dijkstra
from shapely.geometry import LineString, Polygon
from shapely.ops import substring

from atlas.grid import to_address

log = logging.getLogger(__name__)

CRS = 'EPSG:26916'  # UTM 16N, meters
OSM_DIR = Path('reference') / 'raw' / 'osm'
GEOFABRIK_URL = 'https://download.geofabrik.de/north-america/us/illinois-latest.osm.pbf'
HALF_MILE_M = 804.672

# OSMnx 2.1 'walk' filter, applied to the extract instead of an Overpass query.
EXCLUDE_HIGHWAY = {'abandoned', 'bus_guideway', 'construction', 'cycleway', 'motorway', 'motorway_link',
                   'motor', 'no', 'planned', 'platform', 'proposed', 'raceway', 'razed', 'rest_area',
                   'services'}
SEPARATE = ('sidewalk', 'sidewalk:both', 'sidewalk:left', 'sidewalk:right')
TAGS = ['highway', 'area', 'access', 'foot', 'service', 'wheelchair', 'name', *SEPARATE]


def latest_pbf(osm_dir: Path = OSM_DIR) -> tuple[Path, date]:
    """The newest ``illinois-YYMMDD.osm.pbf`` in ``osm_dir`` and its extract date."""
    found = sorted(osm_dir.glob('illinois-*.osm.pbf'))
    if not found:
        raise FileNotFoundError(f'No Illinois extract in {OSM_DIR}; download {GEOFABRIK_URL}')
    path = found[-1]
    stamp = path.name.split('-')[1].split('.')[0]  # YYMMDD
    return path, date(2000 + int(stamp[:2]), int(stamp[2:4]), int(stamp[4:]))


def extract(pbf: Path, area: Polygon, out: Path) -> Path:
    """Cut the highway ways inside ``area`` (lat/lon) to an OSM XML file with ``osmium``."""
    if out.exists():
        return out
    if not shutil.which('osmium'):
        raise RuntimeError('osmium not found; install it with `brew install osmium-tool`')
    poly = out.with_suffix('.area.geojson')
    poly.write_text(gpd.GeoSeries([area], crs='EPSG:4326').to_json())
    tmp = out.with_suffix('.pbf')
    subprocess.run(['osmium', 'extract', '-p', str(poly), '--overwrite', '-s', 'complete_ways',
                    str(pbf), '-o', str(tmp)], check=True)
    subprocess.run(['osmium', 'tags-filter', '--overwrite', str(tmp), 'w/highway', '-o', str(out)],
                   check=True)
    tmp.unlink()
    poly.unlink()
    return out


def _walkable(tags: dict) -> bool:
    if tags.get('area') == 'yes' or tags.get('access') == 'private':
        return False
    if tags.get('highway') in EXCLUDE_HIGHWAY or tags.get('foot') == 'no':
        return False
    if tags.get('service') == 'private':
        return False
    return not any(tags.get(k) == 'separate' for k in SEPARATE)


def walk_graph(xml: Path) -> nx.MultiDiGraph:
    """Walk network from an OSM XML file, filtered as OSMnx 'walk', simplified, projected to meters."""
    ox.settings.useful_tags_way = TAGS
    g = ox.graph_from_xml(xml, bidirectional=True, simplify=False, retain_all=True)
    drop = [(u, v, k) for u, v, k, d in g.edges(keys=True, data=True) if not _walkable(d)]
    g.remove_edges_from(drop)
    g.remove_nodes_from([n for n in list(g.nodes) if g.degree(n) == 0])
    g = ox.simplify_graph(g, edge_attr_aggs={'length': sum})
    g = ox.project_graph(g, to_crs=CRS)
    log.info('Walk graph: %d nodes, %d edges (%d dropped by the walk filter)',
             g.number_of_nodes(), g.number_of_edges(), len(drop))
    return g


def _has(value, wanted: set[str]) -> bool:
    values = value if isinstance(value, list) else [value]
    return any(v in wanted for v in values)


def step_free(g: nx.MultiDiGraph) -> nx.MultiDiGraph:
    """Copy of ``g`` without stairs and ways tagged ``wheelchair=no``."""
    h = g.copy()
    drop = [(u, v, k) for u, v, k, d in h.edges(keys=True, data=True)
            if _has(d.get('highway'), {'steps'}) or _has(d.get('wheelchair'), {'no'})]
    h.remove_edges_from(drop)
    log.info('Step-free graph: %d edges removed (stairs, wheelchair=no)', len(drop))
    return h


@dataclass
class Edges:
    """Undirected edge table of a graph, with geometry, in the graph's node order."""

    nodes: pd.Index      # node ids; row i of the matrix is nodes[i]
    u: np.ndarray        # node positions
    v: np.ndarray
    length: np.ndarray   # meters
    geometry: np.ndarray  # LineString per edge, oriented u -> v

    @classmethod
    def of(cls, g: nx.MultiDiGraph) -> Edges:
        nodes = pd.Index(list(g.nodes))
        xy = {n: (d['x'], d['y']) for n, d in g.nodes(data=True)}
        seen, rows = set(), []
        for u, v, k, d in g.edges(keys=True, data=True):
            key = (min(u, v), max(u, v), d.get('osmid') if not isinstance(d.get('osmid'), list)
                   else tuple(d['osmid']))
            if key in seen:
                continue
            seen.add(key)
            geom = d.get('geometry') or LineString([xy[u], xy[v]])
            rows.append((u, v, d['length'], geom))
        u, v, length, geom = zip(*rows)
        return cls(nodes, nodes.get_indexer(u), nodes.get_indexer(v), np.array(length, float),
                   np.array(geom, dtype=object))

    def matrix(self) -> csr_array:
        n = len(self.nodes)
        w = np.maximum(self.length, 0.01)  # zero-length edges would vanish from a sparse matrix
        return csr_array((np.r_[w, w], (np.r_[self.u, self.v], np.r_[self.v, self.u])), shape=(n, n))


def main_component(g: nx.MultiDiGraph) -> nx.MultiDiGraph:
    """The largest connected piece of ``g``. Removing stairs strands mezzanines, footbridges and
    platforms, which would otherwise catch a station's snap and cut it off from the street."""
    keep = max(nx.weakly_connected_components(g), key=len)
    log.info('Main component: %d of %d nodes', len(keep), g.number_of_nodes())
    return g.subgraph(keep).copy()


def reach(edges: Edges, keys: list[str], points: np.ndarray, limit: float = np.inf,
          max_snap: float = 150) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Distance from every node to the nearest source point, and that source's key ('' = none).

    Each source joins the network as its own node, linked to both ends of its nearest edge by the
    walk along the edge plus the straight walk from the point to it, so that walk counts. Points
    farther than ``max_snap`` meters from the network are left out. Returns node distances, node
    labels and each point's snap offset (inf where left out).
    """
    hit, along, offset = snap(edges, points)
    ok = offset <= max_snap
    n, m = len(edges.nodes), int(ok.sum())
    virt = n + np.arange(m)
    h = hit[ok]
    du, dv = along[ok] + offset[ok], edges.length[h] - along[ok] + offset[ok]
    base = edges.matrix().tocoo()
    rows = np.r_[base.row, virt, edges.u[h], virt, edges.v[h]]
    cols = np.r_[base.col, edges.u[h], virt, edges.v[h], virt]
    w = np.maximum(np.r_[base.data, du, du, dv, dv], 0.01)
    mat = csr_array((w, (rows, cols)), shape=(n + m, n + m))
    dist, _, src = dijkstra(mat, directed=False, indices=virt, limit=limit, min_only=True,
                            return_predecessors=True)
    names = np.array(keys, dtype=object)[ok]
    label = np.where(src >= n, names[np.clip(src - n, 0, m - 1)], '')
    return dist[:n], label[:n], np.where(ok, offset, np.inf)


def snap(edges: Edges, points: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Snap (n, 2) points to their nearest edge: edge index, distance along it from u, offset."""
    tree = shapely.STRtree(edges.geometry)
    pts = shapely.points(points)
    (_, hit), offset = tree.query_nearest(pts, return_distance=True, all_matches=False)
    along = shapely.line_locate_point(edges.geometry[hit], pts)
    return hit, along, offset


def point_distance(edges: Edges, dist: np.ndarray, label: np.ndarray,
                   points: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Network distance from each point (via its nearest edge) to the nearest source, and its key."""
    hit, along, offset = snap(edges, points)
    du = dist[edges.u[hit]] + along
    dv = dist[edges.v[hit]] + (edges.length[hit] - along)
    via_u = du <= dv
    d = np.where(via_u, du, dv) + offset
    key = np.where(via_u, label[edges.u[hit]], label[edges.v[hit]])
    return d, key


def reached(edges: Edges, dist: np.ndarray, label: np.ndarray, limit: float) -> gpd.GeoDataFrame:
    """The parts of every edge within ``limit`` of a source, each tagged with its nearest source."""
    out = []
    for i in range(len(edges.length)):
        du, dv, n = dist[edges.u[i]], dist[edges.v[i]], edges.length[i]
        geom = edges.geometry[i]
        if du <= limit and dv <= limit and du + dv >= n - 0.5:  # whole edge, reached from both ends
            mid = (n + dv - du) / 2  # where the two directions meet
            if label[edges.u[i]] == label[edges.v[i]] or not 0 < mid < n:
                out.append((label[edges.u[i]] if du <= dv else label[edges.v[i]], geom))
            else:
                out.append((label[edges.u[i]], substring(geom, 0, mid)))
                out.append((label[edges.v[i]], substring(geom, mid, n)))
            continue
        if du <= limit:
            out.append((label[edges.u[i]], substring(geom, 0, min(n, limit - du))))
        if dv <= limit:
            out.append((label[edges.v[i]], substring(geom, max(0, n - (limit - dv)), n)))
    keys, geoms = zip(*out) if out else ((), ())
    return gpd.GeoDataFrame({'key': keys}, geometry=list(geoms), crs=CRS)


def shed(lines: gpd.GeoSeries, buffer_m: float = 40, min_hole_m2: float = 20_000) -> shapely.Geometry:
    """Polygon of the street frontage along reached lines: buffered, unioned, small holes filled."""
    parts = np.array([g for g in lines if g.geom_type == 'LineString' and g.length > 0], dtype=object)
    # buffering each piece, then one union, is far faster than buffering a single multi-line
    merged = shapely.union_all(shapely.buffer(parts, buffer_m, quad_segs=4))
    return fill_holes(merged, min_hole_m2)


def fill_holes(geom: shapely.Geometry, min_hole_m2: float) -> shapely.Geometry:
    parts = getattr(geom, 'geoms', [geom])
    kept = [Polygon(p.exterior, [r for r in p.interiors if Polygon(r).area >= min_hole_m2])
            for p in parts if not p.is_empty]
    return shapely.union_all(kept)


def to_rings(geom: shapely.Geometry, crs: str = CRS, tolerance: float = 15) -> list[list[list[list[int]]]]:
    """Polygons in address units: [[exterior, hole, ...], ...], each ring [[x, y], ...], simplified."""
    lonlat = gpd.GeoSeries([geom], crs=crs).to_crs('EPSG:4326').iloc[0]
    xy = shapely.transform(lonlat, lambda c: np.column_stack(to_address(c[:, 1], c[:, 0])))
    xy = shapely.simplify(xy, tolerance, preserve_topology=True)
    polys = []
    for p in getattr(xy, 'geoms', [xy]):
        if p.is_empty or p.area < tolerance**2:
            continue
        rings = [p.exterior, *p.interiors]
        polys.append([[[round(x), round(y)] for x, y in r.coords] for r in rings])
    return polys


def load(xml: Path) -> nx.MultiDiGraph:
    """:func:`walk_graph` of ``xml``, cached as a pickle beside it (building takes minutes)."""
    cache = xml.with_suffix('.graph.pkl')
    if cache.exists():
        return pd.read_pickle(cache)
    g = walk_graph(xml)
    pd.to_pickle(g, cache)
    return g
