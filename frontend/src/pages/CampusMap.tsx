import { useEffect, useState, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Tooltip, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import DashboardLayout from '../layouts/DashboardLayout'
import * as api from '../api'
import type { HeatmapPoint, MapPoint, GpsLocation, TicketStatus } from '../types'
import 'leaflet/dist/leaflet.css'

// ── Constants ─────────────────────────────────────────────────────────────────
const CAMPUS_CENTER: [number, number] = [26.50302, 80.26749]

// ── Category metadata with waste examples ────────────────────────────────────
interface CategoryMeta {
  label: string
  icon: string
  color: string        // hex for Leaflet
  tw: string           // tailwind text colour
  bg: string           // tailwind bg
  border: string       // tailwind border
  description: string
  examples: string[]
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  organic: {
    label: 'Organic Waste',
    icon: '🌿',
    color: '#16a34a',
    tw: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    description: 'Biodegradable materials from food, plants, and natural sources.',
    examples: ['Food scraps & leftovers', 'Fruit & vegetable peels', 'Fallen leaves & grass clippings', 'Tea bags & coffee grounds', 'Garden trimmings'],
  },
  recyclable: {
    label: 'Recyclable Waste',
    icon: '♻️',
    color: '#2563eb',
    tw: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    description: 'Materials that can be processed and reused to make new products.',
    examples: ['Plastic bottles & containers', 'Paper, cardboard & newspapers', 'Glass jars & bottles', 'Aluminium & steel cans', 'Cartons & packaging'],
  },
  hazardous: {
    label: 'Hazardous Waste',
    icon: '⚠️',
    color: '#dc2626',
    tw: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    description: 'Dangerous materials that require special disposal to protect health and environment.',
    examples: ['Used batteries & old electronics', 'Paint, solvents & chemicals', 'Broken fluorescent tubes', 'Medical / lab waste', 'Pesticide containers'],
  },
  general_waste: {
    label: 'General Waste',
    icon: '🗑️',
    color: '#6b7280',
    tw: 'text-gray-700',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    description: 'Mixed non-recyclable, non-hazardous waste that cannot easily be sorted.',
    examples: ['Soiled food wrappers', 'Broken crockery & ceramics', 'Non-recyclable packaging', 'Polystyrene foam', 'Mixed litter & sweepings'],
  },
  resource_wastage: {
    label: 'Resource Wastage',
    icon: '💧',
    color: '#d97706',
    tw: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    description: 'Inefficient use or leakage of campus utilities and natural resources.',
    examples: ['Leaking taps & burst pipes', 'Lights left on in empty rooms', 'Running AC in unoccupied spaces', 'Open water valves', 'Overflowing drainage'],
  },
}

const CATEGORIES = Object.keys(CATEGORY_META)

// ── Status metadata ───────────────────────────────────────────────────────────
const STATUS_META: Record<TicketStatus, { label: string; tw: string; bg: string; dot: string }> = {
  raised:      { label: 'Raised',      tw: 'text-orange-700', bg: 'bg-orange-100', dot: '#f97316' },
  in_progress: { label: 'In Progress', tw: 'text-blue-700',   bg: 'bg-blue-100',   dot: '#3b82f6' },
  resolved:    { label: 'Resolved',    tw: 'text-green-700',  bg: 'bg-green-100',  dot: '#16a34a' },
}

// ── Demo markers ──────────────────────────────────────────────────────────────
const DEMO_STATUSES: TicketStatus[] = ['raised', 'raised', 'in_progress', 'resolved', 'raised', 'in_progress', 'resolved', 'raised']

function makeDemoMarkers(centerLat: number, centerLng: number, count = 8) {
  const cats = [...CATEGORIES, ...CATEGORIES].slice(0, count)
  return cats.map((category, i) => ({
    id: `demo-${i}`,
    category,
    status: DEMO_STATUSES[i % DEMO_STATUSES.length] as TicketStatus,
    lat: centerLat + (Math.random() - 0.5) * 0.012,
    lng: centerLng + (Math.random() - 0.5) * 0.014,
    isDemo: true,
  }))
}

// ── Pulsing SVG icon for "raised" markers ─────────────────────────────────────
function makePulseIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:22px;height:22px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.25;animation:map-pulse 1.8s ease-in-out infinite;"></div>
      <div style="position:absolute;inset:4px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.25);"></div>
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

// ── Muted icon for "resolved" markers ────────────────────────────────────────
function makeMutedIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};opacity:0.45;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.15);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

// ── Normal icon ───────────────────────────────────────────────────────────────
function makeNormalIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

const USER_ICON = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#2563eb;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(37,99,235,0.3);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

// ── Fly-to helper ─────────────────────────────────────────────────────────────
function FlyToLocation({ location }: { location: GpsLocation }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([location.lat, location.lng], 16, { animate: true, duration: 1.2 })
  }, [location, map])
  return null
}

function useUserLocation(): GpsLocation | null {
  const [loc, setLoc] = useState<GpsLocation | null>(null)
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      p => setLoc({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      () => {},
      { timeout: 10000, maximumAge: 30000, enableHighAccuracy: true },
    )
  }, [])
  return loc
}

// ── Unified marker type ───────────────────────────────────────────────────────
interface AnyMarker {
  id: string | number
  category: string
  status: TicketStatus
  lat: number
  lng: number
  isDemo: boolean
}

// ── Category detail panel (side panel / bottom sheet) ────────────────────────
function CategoryPanel({ cat, onClose }: { cat: string; onClose: () => void }) {
  const meta = CATEGORY_META[cat]
  if (!meta) return null
  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${meta.bg} ${meta.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{meta.icon}</span>
          <div>
            <h3 className={`font-bold text-sm ${meta.tw}`}>{meta.label}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{meta.description}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm flex-shrink-0 leading-none mt-0.5">✕</button>
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Examples</p>
        <ul className="space-y-1">
          {meta.examples.map(ex => (
            <li key={ex} className="flex items-center gap-1.5 text-xs text-gray-700">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0`} style={{ background: meta.color }} />
              {ex}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CampusMap() {
  const [heatPoints,  setHeatPoints]  = useState<HeatmapPoint[]>([])
  const [mapPoints,   setMapPoints]   = useState<MapPoint[]>([])
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(CATEGORIES))
  const [statusFilter,  setStatusFilter]  = useState<TicketStatus | 'all'>('all')
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const userLocation = useUserLocation()

  const load = () => {
    api.getHeatmap().then(r => setHeatPoints(r.data))
    api.getMapPoints().then(r => setMapPoints(r.data))
    setLastRefresh(new Date())
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [])

  const demoCenter = userLocation
    ? [userLocation.lat, userLocation.lng] as [number, number]
    : CAMPUS_CENTER

  const demoMarkers = useMemo(
    () => makeDemoMarkers(demoCenter[0], demoCenter[1], 8),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [demoCenter[0].toFixed(3), demoCenter[1].toFixed(3)],
  )

  // Merge demo + real into a single typed list
  const allMarkers: AnyMarker[] = useMemo(() => {
    const real: AnyMarker[] = mapPoints.map(p => ({
      id: p.id, category: p.category, status: p.status, lat: p.lat, lng: p.lng, isDemo: false,
    }))
    return [...real, ...demoMarkers]
  }, [mapPoints, demoMarkers])

  // Apply category + status filters
  const visibleMarkers = useMemo(() =>
    allMarkers.filter(m =>
      activeFilters.has(m.category) &&
      (statusFilter === 'all' || m.status === statusFilter),
    ),
    [allMarkers, activeFilters, statusFilter],
  )

  // Per-category counts (unfiltered)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    CATEGORIES.forEach(c => { counts[c] = 0 })
    allMarkers.forEach(m => { counts[m.category] = (counts[m.category] ?? 0) + 1 })
    return counts
  }, [allMarkers])

  const toggleCat = (cat: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev)
      if (next.has(cat)) { next.delete(cat) } else { next.add(cat) }
      return next
    })
  }

  return (
    <DashboardLayout>
      {/* Global CSS for pulse animation */}
      <style>{`
        @keyframes map-pulse {
          0%, 100% { transform: scale(1); opacity: 0.25; }
          50% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-3">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">🗺️ Issue Map</h1>
            <p className="text-sm text-gray-500">
              Live issue heatmap · auto-refreshes every 60 s ·{' '}
              <span className="text-gray-400">last at {lastRefresh.toLocaleTimeString()}</span>
            </p>
          </div>
          <button
            onClick={load}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* ── Category filter + counts ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Filter by Category — click to toggle</span>
            <button
              onClick={() => setActiveFilters(new Set(CATEGORIES))}
              className="text-[10px] text-green-600 hover:text-green-800 underline underline-offset-2"
            >
              Show all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => {
              const meta   = CATEGORY_META[cat]
              const active = activeFilters.has(cat)
              return (
                <button
                  key={cat}
                  onClick={() => { toggleCat(cat); setSelectedCat(active ? null : cat) }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all
                    ${active ? `${meta.bg} ${meta.border} ${meta.tw}` : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                  <span className={`ml-0.5 text-[10px] font-bold px-1 py-0.5 rounded-full
                    ${active ? 'bg-white/60' : 'bg-gray-200 text-gray-400'}`}>
                    {categoryCounts[cat] ?? 0}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Status filter + legend row ── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status chips */}
          <div className="flex gap-1.5">
            {(['all', 'raised', 'in_progress', 'resolved'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all
                  ${statusFilter === s
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Dot legend */}
          <div className="flex flex-wrap items-center gap-3 ml-auto">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="relative w-5 h-5 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-orange-400 opacity-25 animate-ping" style={{ animationDuration: '1.8s' }} />
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-white" />
              </div>
              Raised
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
              In Progress
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-full bg-green-500 opacity-50 border-2 border-white" />
              Resolved
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow ring-2 ring-blue-300" />
              You
            </div>
          </div>
        </div>

        {/* ── Category detail panel ── */}
        {selectedCat && <CategoryPanel cat={selectedCat} onClose={() => setSelectedCat(null)} />}

        {/* ── Map ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: 'calc(100vh - 340px)', minHeight: 320 }}>
          <MapContainer center={CAMPUS_CENTER} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />

            {userLocation && <FlyToLocation location={userLocation} />}

            {/* Heatmap rings */}
            {heatPoints.map((p, i) => (
              <CircleMarker
                key={i}
                center={[p.lat, p.lng]}
                radius={14 * p.weight}
                pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2 * p.weight, weight: 0 }}
              />
            ))}

            {/* Issue markers */}
            {visibleMarkers.map(m => {
              const meta   = CATEGORY_META[m.category] ?? CATEGORY_META.general_waste
              const sMeta  = STATUS_META[m.status]
              const icon   = m.status === 'raised'
                ? makePulseIcon(meta.color)
                : m.status === 'resolved'
                  ? makeMutedIcon(meta.color)
                  : makeNormalIcon(meta.color)

              return (
                <Marker
                  key={m.id}
                  position={[m.lat, m.lng]}
                  icon={icon}
                >
                  <Popup minWidth={220} maxWidth={280}>
                    <div className="space-y-2.5 py-0.5">
                      {/* Header */}
                      <div className={`flex items-center gap-2 p-2 rounded-lg ${meta.bg}`}>
                        <span className="text-xl">{meta.icon}</span>
                        <div>
                          <div className={`font-bold text-sm ${meta.tw}`}>{meta.label}</div>
                          <div className="text-[10px] text-gray-500">{m.isDemo ? '📌 Demo data' : `Ticket #${m.id}`}</div>
                        </div>
                        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${sMeta.bg} ${sMeta.tw}`}>
                          {sMeta.label}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-600">{meta.description}</p>

                      {/* Waste examples */}
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Includes</p>
                        <div className="flex flex-wrap gap-1">
                          {meta.examples.slice(0, 3).map(ex => (
                            <span key={ex} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${meta.bg} ${meta.border} ${meta.tw}`}>
                              {ex}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Learn more button */}
                      <button
                        onClick={() => setSelectedCat(m.category)}
                        className={`w-full text-xs font-semibold py-1.5 rounded-lg border transition-colors ${meta.bg} ${meta.border} ${meta.tw} hover:opacity-80`}
                      >
                        {meta.icon} See full category details
                      </button>
                    </div>
                  </Popup>
                  <Tooltip direction="top" offset={[0, -10]}>
                    <span className="text-xs font-semibold">{meta.icon} {meta.label}</span>
                  </Tooltip>
                </Marker>
              )
            })}

            {/* User location */}
            {userLocation && (
              <>
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={userLocation.accuracy}
                  pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.08, weight: 1, dashArray: '4 3' }}
                />
                <Marker position={[userLocation.lat, userLocation.lng]} icon={USER_ICON}>
                  <Tooltip permanent direction="top" offset={[0, -12]} className="text-xs font-semibold">
                    📍 You
                  </Tooltip>
                </Marker>
              </>
            )}
          </MapContainer>
        </div>

        {/* ── Bottom info strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {CATEGORIES.map(cat => {
            const meta  = CATEGORY_META[cat]
            const count = categoryCounts[cat] ?? 0
            const active = activeFilters.has(cat)
            return (
              <button
                key={cat}
                onClick={() => setSelectedCat(selectedCat === cat ? null : cat)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left
                  ${active ? `${meta.bg} ${meta.border}` : 'bg-gray-50 border-gray-100 opacity-50'}`}
              >
                <span className="text-lg">{meta.icon}</span>
                <div>
                  <div className={`text-xs font-bold leading-none ${meta.tw}`}>{count}</div>
                  <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{meta.label}</div>
                </div>
                <span className="ml-auto text-gray-300 text-xs">›</span>
              </button>
            )
          })}
        </div>

        {/* ── Prototype note ── */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 flex items-start gap-2">
          <span className="mt-0.5 flex-shrink-0">⚠️</span>
          <span>
            <strong>Prototype Note:</strong> Coloured markers include demo data for visual testing.
            Real-time markers appear automatically as reports are submitted through the app.
          </span>
        </div>

      </div>
    </DashboardLayout>
  )
}
