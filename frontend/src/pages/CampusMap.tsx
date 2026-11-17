import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import DashboardLayout from '../layouts/DashboardLayout'
import * as api from '../api'
import type { HeatmapPoint, MapPoint, GpsLocation } from '../types'
import 'leaflet/dist/leaflet.css'

const CAMPUS_CENTER: [number, number] = [26.50302, 80.26749]

const CATEGORY_COLORS: Record<string, string> = {
  organic: '#22c55e',
  recyclable: '#3b82f6',
  hazardous: '#ef4444',
  general_waste: '#6b7280',
  resource_wastage: '#f59e0b',
}

const CATEGORY_LABELS: Record<string, string> = {
  organic: 'Organic Waste',
  recyclable: 'Recyclable',
  hazardous: 'Hazardous',
  general_waste: 'General Waste',
  resource_wastage: 'Resource Wastage',
}

const CATEGORIES = Object.keys(CATEGORY_COLORS)

// ── Demo markers ─────────────────────────────────────────────────────────────
// Generate N random demo markers scattered near a center point.
// Regenerated each page load (useMemo with no deps) — small jitter so they
// never land on the exact same spot.
function makeDemoMarkers(
  centerLat: number,
  centerLng: number,
  count = 8,
): Array<{ id: string; category: string; lat: number; lng: number }> {
  // Seeded-ish shuffle so we always get one of each category first
  const cats = [...CATEGORIES, ...CATEGORIES].slice(0, count)
  return cats.map((category, i) => ({
    id: `demo-${i}`,
    category,
    lat: centerLat + (Math.random() - 0.5) * 0.012,
    lng: centerLng + (Math.random() - 0.5) * 0.014,
  }))
}

// Blue dot icon for user location
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

function HeatLayer({ points }: { points: HeatmapPoint[] }) {
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

function FlyToLocation({ location }: { location: GpsLocation }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([location.lat, location.lng], 16, { animate: true, duration: 1.2 })
  }, [location, map])
  return null
}

function useUserLocation(): GpsLocation | null {
  const [location, setLocation] = useState<GpsLocation | null>(null)
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => {},
      { timeout: 10000, maximumAge: 30000, enableHighAccuracy: true },
    )
  }, [])
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

  // Demo markers centered on user location if available, else campus center
  const demoCenter = userLocation
    ? [userLocation.lat, userLocation.lng] as [number, number]
    : CAMPUS_CENTER

  // useMemo so they don't re-randomise on every render, only when center changes
  const demoMarkers = useMemo(
    () => makeDemoMarkers(demoCenter[0], demoCenter[1], 8),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [demoCenter[0].toFixed(3), demoCenter[1].toFixed(3)],
  )

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">🗺️ Map</h1>
            <p className="text-sm text-gray-500">Live issue heatmap — auto-refreshes every 60s</p>
          </div>
          <div className="text-sm text-gray-500">{heatPoints.length} open issues</div>
        </div>

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

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ height: 'calc(100vh - 240px)', minHeight: 300 }}>
          <MapContainer center={CAMPUS_CENTER} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />

            {userLocation && <FlyToLocation location={userLocation} />}
            <HeatLayer points={heatPoints} />

            {/* ── Demo markers (always visible, prototype only) ── */}
            {demoMarkers.map((m) => (
              <CircleMarker
                key={m.id}
                center={[m.lat, m.lng]}
                radius={7}
                pathOptions={{
                  color: CATEGORY_COLORS[m.category],
                  fillColor: CATEGORY_COLORS[m.category],
                  fillOpacity: 0.85,
                  weight: 1.5,
                }}
              >
                <Popup>
                  <div className="text-sm space-y-1">
                    <div className="font-bold" style={{ color: CATEGORY_COLORS[m.category] }}>
                      {CATEGORY_LABELS[m.category]}
                    </div>
                    <div className="text-xs text-gray-500 italic">
                      📌 Demo data — for prototyping only
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Real DB map points */}
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
                    <div className="text-xs text-gray-400 mt-1">Status: {p.status}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* User location dot */}
            {userLocation && (
              <>
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={userLocation.accuracy}
                  pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.1, weight: 1, dashArray: '4 3' }}
                />
                <Marker position={[userLocation.lat, userLocation.lng]} icon={USER_LOCATION_ICON}>
                  <Tooltip permanent direction="top" offset={[0, -10]} className="text-xs">
                    Your Location
                  </Tooltip>
                </Marker>
              </>
            )}
          </MapContainer>
        </div>

        {/* Prototype note */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 flex items-start gap-2">
          <span className="mt-0.5 flex-shrink-0">⚠️</span>
          <span>
            <strong>Prototype Note:</strong> The coloured markers shown on this map are demo data for visual testing only.
            Real-time markers will appear here automatically once actual reports are submitted through the app.
          </span>
        </div>
      </div>
    </DashboardLayout>
  )
}
