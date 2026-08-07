import { useEffect, useState } from 'react'
import DashboardLayout from '../layouts/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import TicketCard from '../components/TicketCard'
import RouterMonitorCard from '../components/RouterMonitorCard'
import * as api from '../api'
import type { Ticket, TicketStatus } from '../types'

export default function DeptPortal() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filter, setFilter] = useState<TicketStatus | ''>('')
  const [updating, setUpdating] = useState<number | null>(null)

  const load = () =>
    api.getTickets(filter ? { status: filter, limit: 100 } : { limit: 100 })
      .then(r => setTickets(r.data))

  useEffect(() => { load() }, [filter])

  const updateStatus = async (id: number, status: TicketStatus) => {
    setUpdating(id)
    await api.updateTicketStatus(id, status)
    await load()
    setUpdating(null)
  }

  const stats = {
    raised: tickets.filter(t => t.status === 'raised').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">🏢 Department Portal</h1>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Raised', value: stats.raised, color: 'text-orange-600' },
            { label: 'In Progress', value: stats.in_progress, color: 'text-blue-600' },
            { label: 'Resolved', value: stats.resolved, color: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl shadow-sm border p-4 text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Router card */}
        {user?.department_id && <RouterMonitorCard deptId={user.department_id} />}

        {/* Ticket queue */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Ticket Queue</h3>
            <select value={filter} onChange={e => setFilter(e.target.value as TicketStatus | '')}
              className="border rounded-lg text-sm px-3 py-1.5">
              <option value="">All Statuses</option>
              <option value="raised">Raised</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="space-y-3">
            {tickets.length === 0 && <p className="text-sm text-gray-400 italic">No tickets in your department.</p>}
            {tickets.map(t => (
              <div key={t.id} className="flex items-start gap-3">
                <div className="flex-1"><TicketCard ticket={t} /></div>
                <div className="flex flex-col gap-2 flex-shrink-0 pt-2">
                  {t.status !== 'in_progress' && t.status !== 'resolved' && (
                    <button disabled={updating === t.id}
                      onClick={() => updateStatus(t.id, 'in_progress')}
                      className="text-xs bg-blue-100 text-blue-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-200 disabled:opacity-50">
                      Start →
                    </button>
                  )}
                  {t.status !== 'resolved' && (
                    <button disabled={updating === t.id}
                      onClick={() => updateStatus(t.id, 'resolved')}
                      className="text-xs bg-green-100 text-green-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-green-200 disabled:opacity-50">
                      Resolve ✓
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
