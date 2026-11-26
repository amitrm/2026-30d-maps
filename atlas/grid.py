"""Chicago address-grid coordinates, the shared coordinate system of the atlas.

Chicago addresses count 800 numbers per mile from an origin at State Street (east-west) and
Madison Street (north-south). Plates are drawn in "address units": 800 per mile, with 1,200 for the
first mile south of Madison (to Roosevelt Road, 1200 South). The unit is a position code, exact both
ways with miles. South of Roosevelt it is not the street address: the street centerlines show 1,000
numbers in the second mile (to Cermak Road, 2200 S) and 900 in the third (to 31st Street), then 800
a mile (Plate XXII). :func:`address_south` gives the real number; the site labels grid lines with it
(``src/lib/grid.js``).

Distances use a local equirectangular approximation around the origin, which is accurate to well
under 1% across the city.
"""

from __future__ import annotations

import numpy as np
import numpy.typing as npt

ORIGIN_LAT = 41.88199   # Madison Street at State Street
ORIGIN_LON = -87.62783
MILES_PER_DEG_LAT = 69.05
MILES_PER_DEG_LON = 69.172 * np.cos(np.radians(ORIGIN_LAT))

NUMBERS_PER_MILE = 800
FIRST_MILE_SOUTH = 1200  # Madison to Roosevelt

ArrayLike = npt.ArrayLike


def miles_from_origin(lat: ArrayLike, lon: ArrayLike) -> tuple[np.ndarray, np.ndarray]:
    """Return (east, north) distance in miles from State & Madison; negative = west / south."""
    east = (np.asarray(lon, dtype=float) - ORIGIN_LON) * MILES_PER_DEG_LON
    north = (np.asarray(lat, dtype=float) - ORIGIN_LAT) * MILES_PER_DEG_LAT
    return east, north


def north_to_address(north: ArrayLike) -> np.ndarray:
    """Convert miles north of Madison to an address number (negative = south)."""
    n = np.asarray(north, dtype=float)
    return np.select(
        [n >= 0, n >= -1],
        [n * NUMBERS_PER_MILE, n * FIRST_MILE_SOUTH],
        default=-FIRST_MILE_SOUTH + (n + 1) * NUMBERS_PER_MILE,
    )


def address_south(miles: ArrayLike) -> np.ndarray:
    """Real address number at a true distance south of Madison (Roosevelt, Cermak and 31st taken as
    one, two and three miles south; 800 a mile beyond)."""
    m = np.asarray(miles, dtype=float)
    return np.where(m >= 3, 3100 + (m - 3) * 800, np.interp(m, [0, 1, 2, 3], [0, 1200, 2200, 3100]))


def to_address(lat: ArrayLike, lon: ArrayLike) -> tuple[np.ndarray, np.ndarray]:
    """Project latitude/longitude to address units (x: + east / - west, y: + north / - south)."""
    east, north = miles_from_origin(lat, lon)
    return east * NUMBERS_PER_MILE, north_to_address(north)
