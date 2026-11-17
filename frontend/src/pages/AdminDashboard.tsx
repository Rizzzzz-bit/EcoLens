import { useEffect, useState } from 'react'
import DashboardLayout from '../layouts/DashboardLayout'
import TicketCard from '../components/TicketCard'
import { UserLeaderboard } from '../components/Leaderboard'
import * as api from '../api'
import type { Ticket, TicketStatus, LeaderboardUser } from '../types'

const STAT_CARDS = [
  { key: 'total',       label: 'Total',       icon: '🎫', cls: 'stat-purple' },
  { key: 'raised',      label: 'Raised',      icon: '🔴', cls: 'stat-amber'  },
  { key: 'in_progress', label: 'In Progress', icon: '🔵', cls: 'stat-blue'   },
  { key: 'resolved',    label: 'Resolved',    icon: '✅', cls: 'stat-green'  },
] as const

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
    total:       tickets.length,
    raised:      tickets.filter(t => t.status === 'raised').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved:    tickets.filter(t => t.status === 'resolved').length,
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">

        {/* ── Hero header ── */}
        <div className="rounded-2xl p-5 md:p-6"
          style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 60%, #065f46 100%)' }}>
          <p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-1">Control Panel</p>
          <h1 className="text-xl md:text-2xl font-extrabold text-white">Admin Dashboard ⚙️</h1>
          <p className="text-green-300/70 text-sm mt-0.5">Manage tickets, users & platform activity</p>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STAT_CARDS.map(s => (
            <div key={s.key} className={`${s.cls} rounded-2xl border p-4 card-hover flex items-center gap-3`}>
              <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center text-xl flex-shrink-0">
                {s.icon}
              </div>
              <div>
                <div className="text-2xl font-extrabold text-gray-800">{stats[s.key]}</div>
                <div className="text-xs text-gray-500 font-medium">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="bg-white rounded-2xl border border-gray-100" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {(['tickets', 'users'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-shrink-0 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all
                  ${tab === t
                    ? 'border-green-500 text-green-700 bg-green-50/50'
                    : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                {t === 'tickets' ? '🎫 Tickets' : '👥 Users'}
              </button>
            ))}
          </div>

          <div className="p-5">
            {tab === 'tickets' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-500">
                    {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
                  </span>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value as TicketStatus | '')}
                    className="border border-gray-200 rounded-xl text-sm px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400">
                    <option value="">All Statuses</option>
                    <option value="raised">Raised</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                {tickets.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-sm">No tickets found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.map(t => (
                      <div key={t.id} className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                        <div className="flex-1 w-full"><TicketCard ticket={t} /></div>
                        {t.status !== 'resolved' && (
                          <div className="flex sm:flex-col flex-row gap-2 flex-shrink-0 sm:pt-1 w-full sm:w-auto">
                            {t.status === 'raised' && (
                              <button
                                disabled={updating === t.id}
                                onClick={() => updateStatus(t.id, 'in_progress')}
                                className="flex-1 sm:flex-none text-xs bg-blue-50 border border-blue-200 text-blue-700 font-semibold px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50">
                                Start →
                              </button>
                            )}
                            <button
                              disabled={updating === t.id}
                              onClick={() => updateStatus(t.id, 'resolved')}
                              className="flex-1 sm:flex-none text-xs bg-green-50 border border-green-200 text-green-700 font-semibold px-3 py-2 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-50">
                              {updating === t.id ? '…' : 'Resolve ✓'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {tab === 'users' && <UserLeaderboard users={users} />}
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
