import { useEffect, useState } from 'react'
import DashboardLayout from '../layouts/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import TicketCard from '../components/TicketCard'
import RouterMonitorCard from '../components/RouterMonitorCard'
import { UserLeaderboard } from '../components/Leaderboard'
import * as api from '../api'
import type { Ticket, TicketStatus, LeaderboardUser } from '../types'

export default function WardenPortal() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [residents, setResidents] = useState<LeaderboardUser[]>([])
  const [updating, setUpdating] = useState<number | null>(null)

  const load = () =>
    api.getTickets({ limit: 100 }).then(r => setTickets(r.data))

  useEffect(() => {
    load()
    if (user?.department_id)
      api.getLeaderboardUsers(user.department_id).then(r => setResidents(r.data))
  }, [])

  const updateStatus = async (id: number, status: TicketStatus) => {
    setUpdating(id)
    await api.updateTicketStatus(id, status)
    await load()
    setUpdating(null)
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">🏠 Warden Portal</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Router */}
          {user?.department_id && <RouterMonitorCard deptId={user.department_id} />}

          {/* Stats */}
          <div className="bg-white rounded-xl shadow-sm border p-4 grid grid-cols-2 gap-4">
            {[
              { label: 'Open', value: tickets.filter(t => t.status === 'raised').length, color: 'text-orange-600' },
              { label: 'In Progress', value: tickets.filter(t => t.status === 'in_progress').length, color: 'text-blue-600' },
              { label: 'Resolved', value: tickets.filter(t => t.status === 'resolved').length, color: 'text-green-600' },
              { label: 'Total', value: tickets.length, color: 'text-gray-700' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket list */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Hostel Issue Tickets</h3>
          <div className="space-y-3">
            {tickets.length === 0 && <p className="text-sm text-gray-400 italic">No tickets.</p>}
            {tickets.map(t => (
              <div key={t.id} className="flex items-start gap-3">
                <div className="flex-1"><TicketCard ticket={t} /></div>
                {t.status !== 'resolved' && (
                  <div className="flex flex-col gap-2 flex-shrink-0 pt-2">
                    {t.status === 'raised' && (
                      <button disabled={updating === t.id}
                        onClick={() => updateStatus(t.id, 'in_progress')}
                        className="text-xs bg-blue-100 text-blue-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-200">
                        Start →
                      </button>
                    )}
                    <button disabled={updating === t.id}
                      onClick={() => updateStatus(t.id, 'resolved')}
                      className="text-xs bg-green-100 text-green-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-green-200">
                      Resolve ✓
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Resident leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-800 mb-4">🏆 Hostel Resident Leaderboard</h3>
          <UserLeaderboard users={residents} />
        </div>
      </div>
    </DashboardLayout>
  )
}
