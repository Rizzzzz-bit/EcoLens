import { useEffect, useState } from 'react'
import DashboardLayout from '../layouts/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import TicketCard from '../components/TicketCard'
import StatusStepper from '../components/StatusStepper'
import * as api from '../api'
import { getImageUrl } from '../api/client'
import type { Ticket } from '../types'

export default function MyTickets() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getTickets({ limit: 100 }).then(r => { setTickets(r.data); setLoading(false) })
  }, [])

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-5">🎫 My Reports</h1>

        <div className="flex gap-6">
          {/* List */}
          <div className="flex-1 space-y-3">
            {loading && <p className="text-gray-400 text-sm">Loading…</p>}
            {!loading && tickets.length === 0 && (
              <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">
                <div className="text-4xl mb-2">📭</div>
                <p>No reports yet. Be a campus eco-hero!</p>
              </div>
            )}
            {tickets.map(t => (
              <TicketCard key={t.id} ticket={t} onClick={() => setSelected(t)} />
            ))}
          </div>

          {/* Detail panel — sidebar on desktop, full-screen overlay on mobile */}
          {selected && (
            <>
              {/* Mobile overlay backdrop */}
              <div
                className="md:hidden fixed inset-0 bg-black/40 z-40"
                onClick={() => setSelected(null)}
              />
              <div className="
                fixed inset-x-0 bottom-0 z-50 md:static md:z-auto
                w-full md:w-80 md:flex-shrink-0
                bg-white rounded-t-2xl md:rounded-2xl border shadow-lg md:shadow-sm
                p-5 md:h-fit md:sticky md:top-6
                max-h-[80vh] md:max-h-none overflow-y-auto
              ">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">Ticket #{selected.id}</h3>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                </div>
                {selected.image_url && (
                  <img src={getImageUrl(selected.image_url)} alt="ticket"
                    className="w-full h-40 object-cover rounded-xl mb-4" />
                )}
                <StatusStepper status={selected.status} />
                <div className="mt-4 space-y-2 text-sm">
                  <div className="bg-orange-50 rounded-lg p-3 text-orange-800">
                    {selected.action_recommendation}
                  </div>
                  {selected.eco_tip && (
                    <div className="bg-green-50 rounded-lg p-3 text-green-800">💡 {selected.eco_tip}</div>
                  )}
                  <div className="text-xs text-gray-400">
                    📍 {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}<br />
                    🕐 {new Date(selected.created_at.endsWith('Z') ? selected.created_at : selected.created_at + 'Z').toLocaleString()}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
