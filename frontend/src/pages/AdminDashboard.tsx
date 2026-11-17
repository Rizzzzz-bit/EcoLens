import { useEffect, useState } from 'react'
import DashboardLayout from '../layouts/DashboardLayout'
import TicketCard from '../components/TicketCard'
import { UserLeaderboard } from '../components/Leaderboard'
import * as api from '../api'
import type { Ticket, TicketStatus, LeaderboardUser } from '../types'

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [tab, setTab] = useState<'tickets' | 'users'>('tickets')
  const [filterStatus, setFilterStatus] = useState<TicketStatus | ''>('')
  const [updating, setUpdating] = useState<number | null>(null)

  const load = () =>
    api.getTickets(filterStatus ? { status: filterStatus, limit: 200 } : { limit: 200 })
      .then(r => setTickets(r.data))

  useEffect(() => {
    load()
    api.getLeaderboardUsers().then(r => setUsers(r.data))
  }, [])

  useEffect(() => { load() }, [filterStatus])

  const updateStatus = async (id: number, status: TicketStatus) => {
    setUpdating(id)
    await api.updateTicketStatus(id, status)
    await load()
    setUpdating(null)
  }

  const stats = {
    total: tickets.length,
    raised: tickets.filter(t => t.status === 'raised').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">⚙️ Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: 'Total Tickets', value: stats.total, color: 'text-gray-700' },
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

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="flex border-b overflow-x-auto">
            {(['tickets', 'users'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${tab === t ? 'border-green-500 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t === 'tickets' ? '🎫 Tickets' : '👥 Users'}
              </button>
            ))}
          </div>

          <div className="p-5">
            {tab === 'tickets' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">{tickets.length} tickets</span>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as TicketStatus | '')}
                    className="border rounded-lg text-sm px-3 py-1.5">
                    <option value="">All Statuses</option>
                    <option value="raised">Raised</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div className="space-y-3">
                  {tickets.map(t => (
                    <div key={t.id} className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                      <div className="flex-1 w-full"><TicketCard ticket={t} /></div>
                      {t.status !== 'resolved' && (
                        <div className="flex sm:flex-col flex-row gap-2 flex-shrink-0 sm:pt-2 w-full sm:w-auto">
                          {t.status === 'raised' && (
                            <button disabled={updating === t.id}
                              onClick={() => updateStatus(t.id, 'in_progress')}
                              className="flex-1 sm:flex-none text-xs bg-blue-100 text-blue-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-200">
                              Start →
                            </button>
                          )}
                          <button disabled={updating === t.id}
                            onClick={() => updateStatus(t.id, 'resolved')}
                            className="flex-1 sm:flex-none text-xs bg-green-100 text-green-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-green-200">
                            Resolve ✓
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab === 'users' && <UserLeaderboard users={users} />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
