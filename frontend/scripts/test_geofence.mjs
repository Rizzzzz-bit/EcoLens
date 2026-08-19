/**
 * Geofence unit tests — frontend (campus.ts)
 *
 * Run from the frontend directory (Node.js, no bundler needed):
 *   node --experimental-vm-modules scripts/test_geofence.mjs
 *
 * Or from the repo root:
 *   node --input-type=module < EcoCSJMU/frontend/scripts/test_geofence.mjs
 *
 * We inline the polygon and algorithm here so this file has zero dependencies
 * and can be run with plain Node without TypeScript compilation.
 * The logic is identical to frontend/src/config/campus.ts.
 */

// ── Inline the polygon (copied verbatim from campus.ts) ───────────────────────
const CAMPUS_POLYGON = [
  [26.4965919, 80.2696411],
  [26.5070579, 80.2739292],
  [26.5094728, 80.2673913],
  [26.5038463, 80.2632916],
  [26.5035256, 80.2631244],
  [26.5032702, 80.2629912],
  [26.5027534, 80.2638205],
  [26.5022709, 80.2632809],
  [26.5024332, 80.2630646],
  [26.5010139, 80.2618754],
  [26.5004666, 80.2621865],
  [26.4999553, 80.2610547],
  [26.4995976, 80.2611056],
  [26.4993528, 80.2621007],
  [26.4982486, 80.2617145],
  [26.4975645, 80.2639997],
  [26.4967723, 80.2666685],
  [26.4965683, 80.2673283],
  [26.4971828, 80.2676636],
  [26.4970964, 80.2679747],
  [26.4969260, 80.2679077],
  [26.4967531, 80.2683315],
  [26.4969476, 80.2684361],
  [26.4968625, 80.2687228],
  [26.4967797, 80.2690014],
]

// ── Ray-casting algorithm (identical to campus.ts) ────────────────────────────
function isInsidePolygon(lat, lng, polygon = CAMPUS_POLYGON) {
  const n = polygon.length
  let inside = false
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [yi, xi] = polygon[i]
    const [yj, xj] = polygon[j]
    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }
  return inside
}

function isInsideCampus(lat, lng) {
  return isInsidePolygon(lat, lng)
}

// ── Test cases ────────────────────────────────────────────────────────────────
const CASES = [
  { lat: 26.503, lng: 80.267, expected: true,  label: "Inside  — CSJMU campus centre"     },
  { lat: 26.449, lng: 80.331, expected: false, label: "Outside — Kanpur city centre"       },
  { lat: 26.847, lng: 80.948, expected: false, label: "Outside — old placeholder coordinate" },
]

let passed = 0
let failed = 0

console.log("Frontend geofence tests\n" + "=".repeat(45))
for (const { lat, lng, expected, label } of CASES) {
  const result   = isInsideCampus(lat, lng)
  const ok       = result === expected
  const status   = ok ? "PASS" : "FAIL"
  const mark     = ok ? "✓"    : "✗"
  const verdict  = result ? "inside" : "outside"
  console.log(`  ${mark} [${status}]  (${lat}, ${lng})  →  ${verdict}  |  ${label}`)
  ok ? passed++ : failed++
}

console.log("=".repeat(45))
console.log(`  ${passed} passed, ${failed} failed\n`)
process.exit(failed === 0 ? 0 : 1)
