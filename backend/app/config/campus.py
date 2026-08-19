"""
CSJMU Campus Geofence
=====================

Source: OpenStreetMap way ID 506689489
  https://www.openstreetmap.org/way/506689489
  Tagged amenity=university, name="Chhatrapati Shahu Ji Maharaj University"

The polygon vertices below are the ordered OSM nodes of that way, retrieved
from the OSM API (api.openstreetmap.org/api/0.6/way/506689489/full.json).
The closing node (same as the first) is omitted; the algorithm treats the
ring as implicitly closed.

To update the boundary: replace CAMPUS_POLYGON with a new ordered list of
(lat, lon) tuples and update the OSM_WAY_ID reference.
"""

from typing import List, Tuple

OSM_WAY_ID = 506689489

# Ordered boundary vertices (latitude, longitude).
# Do not edit without updating the source reference above.
CAMPUS_POLYGON: List[Tuple[float, float]] = [
    (26.4965919, 80.2696411),  # node 4963731102
    (26.5070579, 80.2739292),  # node 4963731101
    (26.5094728, 80.2673913),  # node 4963731100
    (26.5038463, 80.2632916),  # node 4963731099
    (26.5035256, 80.2631244),  # node 7054749052
    (26.5032702, 80.2629912),  # node 4963731098
    (26.5027534, 80.2638205),  # node 4963731097
    (26.5022709, 80.2632809),  # node 7054748808
    (26.5024332, 80.2630646),  # node 7054749137
    (26.5010139, 80.2618754),  # node 4963731096
    (26.5004666, 80.2621865),  # node 4963731095
    (26.4999553, 80.2610547),  # node 4963731094
    (26.4995976, 80.2611056),  # node 4963731093
    (26.4993528, 80.2621007),  # node 4963731092
    (26.4982486, 80.2617145),  # node 4963731091
    (26.4975645, 80.2639997),  # node 4963731090
    (26.4967723, 80.2666685),  # node 8847427034
    (26.4965683, 80.2673283),  # node 8847427035
    (26.4971828, 80.2676636),  # node 8847427036
    (26.4970964, 80.2679747),  # node 8847427037
    (26.4969260, 80.2679077),  # node 8847427038
    (26.4967531, 80.2683315),  # node 8847427039
    (26.4969476, 80.2684361),  # node 8847427040
    (26.4968625, 80.2687228),  # node 8814800408
    (26.4967797, 80.2690014),  # node 13328049466
]


def is_inside_polygon(
    lat: float,
    lng: float,
    polygon: List[Tuple[float, float]] = CAMPUS_POLYGON,
) -> bool:
    """
    Ray-casting point-in-polygon test.

    Casts a horizontal ray from (lat, lng) rightward and counts how many edges
    of the polygon it crosses.  An odd count means the point is inside.
    This is the standard O(n) algorithm; it works correctly for simple
    (non-self-intersecting) polygons regardless of winding order.

    Args:
        lat:     WGS-84 latitude of the point to test.
        lng:     WGS-84 longitude of the point to test.
        polygon: Ordered ring of (lat, lon) tuples; need not repeat first vertex.

    Returns:
        True if the point is strictly inside the polygon.
    """
    n = len(polygon)
    inside = False
    j = n - 1
    for i in range(n):
        yi, xi = polygon[i]
        yj, xj = polygon[j]
        if (yi > lat) != (yj > lat) and lng < (xj - xi) * (lat - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def is_inside_campus(lat: float, lng: float) -> bool:
    """Convenience wrapper — tests the point against the CSJMU campus polygon."""
    return is_inside_polygon(lat, lng)
