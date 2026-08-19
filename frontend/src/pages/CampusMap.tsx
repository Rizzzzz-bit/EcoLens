import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import DashboardLayout from '../layouts/DashboardLayout'
import * as api from '../api'
import type { HeatmapPoint, MapPoint, GpsLocation } from '../types'
import 'leaflet/dist/leaflet.css'

// Real CSJMU campus centre (OSM way 506689489)
const CAMPUS_CENTER: [number, number] = [26.50302, 80.26749]

// ---------------------------------------------------------------------------
// DEV-ONLY: in-memory test markers — NEVER written to the database.
// To activate: append ?testMarkers=1 to the URL (e.g. /map?testMarkers=1).
// These are hardcoded inside the CSJMU campus polygon so they always appear
// in the correct viewport regardless of what the database contains.
// Remove this block (and its JSX usage below) before going to production.
// ---------------------------------------------------------------------------
const DEV_TEST_MARKERS: Array<{ category: string; lat: number; lng: number; label: string }> = [
  { category: 'organic',          lat: 26.5055, lng: 80.2700, label: 'TEST: organic → green' },
  { category: 'recyclable',       lat: 26.5040, lng: 80.2720, label: 'TEST: recyclable → blue' },
  { category: 'hazardous',        lat: 26.5025, lng: 80.2695, label: 'TEST: hazardous → red' },
  { category: 'general_waste',    lat: 26.5010, lng: 80.2660, label: 'TEST: general_waste → grey' },
  { category: 'resource_wastage', lat: 26.5030, lng: 80.2640, label: 'TEST: resource_wastage → orange' },
]

// Blue pulsing icon for the user-location marker
const USER_LOCATION_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width:16px;height:16px;
    background:#2563eb;
    border:3px solid #fff;
    border-radius:50%;
    box-shadow:0 0 0 2px #2563eb;
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const CATEGORY_COLORS: Record<string, string> = {
  organic: '#22c55e',
  recyclable: '#3b82f6',
  hazardous: '#ef4444',
  general_waste: '#6b7280',
  resource_wastage: '#f59e0b',
}

function HeatLayer({ points }: { points: HeatmapPoint[] }) {
  // Render heat as circles with opacity proportional to weight
  return (
    <>
      {points.map((p, i) => (
        <CircleMarker
          key={i}
          center={[p.lat, p.lng]}
          radius={14 * p.weight}
          pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.25 * p.weight, weight: 0 }}
        />
      ))}
    </>
  )
}

/** Request the user's GPS location once.  Never falls back to a fake coord. */
function useUserLocation(): GpsLocation | null {
  const [location, setLocation] = useState<GpsLocation | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
      },
      () => { /* permission denied / unavailable — silently omit the marker */ },
      { timeout: 10000, maximumAge: 30000, enableHighAccuracy: true },
    )
  }, [])   // run once on mount only; no repeated recentring

  return location
}

export default function CampusMap() {
  const [heatPoints, setHeatPoints] = useState<HeatmapPoint[]>([])
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([])
  const userLocation = useUserLocation()

  const load = () => {
    api.getHeatmap().then(r => setHeatPoints(r.data))
    api.getMapPoints().then(r => setMapPoints(r.data))
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [])

  const showTestMarkers = new URLSearchParams(window.location.search).get('testMarkers') === '1'

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🗺️ Campus Map</h1>
            <p className="text-sm text-gray-500">Live issue heatmap — auto-refreshes every 60s</p>
          </div>
          <div className="text-sm text-gray-500">{heatPoints.length} open issues</div>
        </div>

        {/* DEV TEST BANNER — only shown when ?testMarkers=1 */}
        {showTestMarkers && (
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 text-xs text-yellow-800 font-medium">
            ⚠️ DEV MODE — Showing 5 in-memory test markers (one per category). Not in the database. Remove <code>?testMarkers=1</code> to hide.
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="w-3 h-3 rounded-full" style={{ background: color }} />
              {cat.replace('_', ' ')}
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-3 h-3 rounded-full border-2 border-white ring-2 ring-blue-600" style={{ background: '#2563eb' }} />
            Your Location
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ height: 500 }}>
          <MapContainer center={CAMPUS_CENTER} zoom={16} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <HeatLayer points={heatPoints} />

            {/* DEV-ONLY test markers — rendered above the heat layer, never in DB */}
            {showTestMarkers && DEV_TEST_MARKERS.map((m) => (
              <CircleMarker
                key={`dev-${m.category}`}
                center={[m.lat, m.lng]}
                radius={10}
                pathOptions={{
                  color: CATEGORY_COLORS[m.category],
                  fillColor: CATEGORY_COLORS[m.category],
                  fillOpacity: 1,
                  weight: 2,
                }}
              >
                <Tooltip permanent direction="top" offset={[0, -12]} className="text-xs font-bold">
                  {m.label}
                </Tooltip>
                <Popup>
                  <div className="text-sm">
                    <div className="font-bold text-yellow-700">🧪 DEV TEST MARKER</div>
                    <div className="mt-1"><b>Category:</b> {m.category}</div>
                    <div><b>Colour:</b> {CATEGORY_COLORS[m.category]}</div>
                    <div><b>Coords:</b> {m.lat}, {m.lng}</div>
                    <div className="text-xs text-gray-400 mt-1">Not stored in database</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* User location — accuracy circle + dot marker */}
            {userLocation && (
              <>
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={userLocation.accuracy}
                  pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.1, weight: 1, dashArray: '4 3' }}
                />
                <Marker
                  position={[userLocation.lat, userLocation.lng]}
                  icon={USER_LOCATION_ICON}
                >
                  <Tooltip permanent direction="top" offset={[0, -10]} className="text-xs">
                    Your Location
                  </Tooltip>
                  <Popup>
                    <div className="text-sm">
                      <div className="font-bold">📍 Your Location</div>
                      <div className="text-gray-600 mt-1">
                        {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Accuracy: ±{Math.round(userLocation.accuracy)} m
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}

            {mapPoints.map(p => (
              <CircleMarker
                key={p.id}
                center={[p.lat, p.lng]}
                radius={6}
                pathOptions={{
                  color: CATEGORY_COLORS[p.category] || '#6b7280',
                  fillColor: CATEGORY_COLORS[p.category] || '#6b7280',
                  fillOpacity: 0.9,
                  weight: 1.5,
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-bold">#{p.id} — {p.category.replace('_', ' ')}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Status: {p.status}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>
    </DashboardLayout>
  )
}
