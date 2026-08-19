"""
Geofence unit tests — backend (campus.py)

Run from the repo root:
    python EcoCSJMU/backend/scripts/test_geofence.py

Or inside the backend container:
    python scripts/test_geofence.py

No external dependencies required.
"""
import sys
import os

# Allow running from repo root or from inside the backend directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.config.campus import is_inside_campus

CASES = [
    # (lat,      lng,      expected,  label)
    (26.503,  80.267,  True,   "Inside  — CSJMU campus centre"),
    (26.449,  80.331,  False,  "Outside — Kanpur city centre"),
    (26.847,  80.948,  False,  "Outside — old placeholder coordinate"),
]

passed = 0
failed = 0

print("Backend geofence tests\n" + "=" * 45)
for lat, lng, expected, label in CASES:
    result = is_inside_campus(lat, lng)
    ok = result == expected
    status = "PASS" if ok else "FAIL"
    mark   = "✓" if ok else "✗"
    print(f"  {mark} [{status}]  ({lat}, {lng})  →  {'inside' if result else 'outside'}  |  {label}")
    if ok:
        passed += 1
    else:
        failed += 1

print("=" * 45)
print(f"  {passed} passed, {failed} failed\n")
sys.exit(0 if failed == 0 else 1)
