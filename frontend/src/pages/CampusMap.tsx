import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import DashboardLayout from '../layouts/DashboardLayout'
import * as api from '../api'
import type { HeatmapPoint, Ticket } from '../types'
import 'leaflet/dist/leaflet.css'

// CSJMU campus centre
const CAMPUS_CENTER: [number, number] = [26.847, 80.948]

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

export default function CampusMap() {
  const [heatPoints, setHeatPoints] = useState<HeatmapPoint[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])

  const load = () => {
    api.getHeatmap().then(r => setHeatPoints(r.data))
    api.getTickets({ limit: 200 }).then(r => setTickets(r.data))
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [])

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

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="w-3 h-3 rounded-full" style={{ background: color }} />
              {cat.replace('_', ' ')}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ height: 500 }}>
          <MapContainer center={CAMPUS_CENTER} zoom={16} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <HeatLayer points={heatPoints} />
            {tickets.filter(t => t.status !== 'resolved').map(t => (
              <CircleMarker
                key={t.id}
                center={[t.lat, t.lng]}
                radius={6}
                pathOptions={{
                  color: CATEGORY_COLORS[t.category] || '#6b7280',
                  fillColor: CATEGORY_COLORS[t.category] || '#6b7280',
                  fillOpacity: 0.9,
                  weight: 1.5,
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-bold">#{t.id} — {t.category.replace('_', ' ')}</div>
                    <div className="text-gray-600 mt-1">{t.action_recommendation}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Status: {t.status} · {t.department?.name}
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
