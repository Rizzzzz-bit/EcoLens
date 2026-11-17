import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import ScoreGauge from '../components/ScoreGauge'
import BadgeShelf from '../components/BadgeShelf'
import TicketCard from '../components/TicketCard'
import { UserLeaderboard } from '../components/Leaderboard'
import * as api from '../api'
import type { Ticket, UserBadge, LeaderboardUser } from '../types'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [reportCount, setReportCount] = useState<number | null>(null)
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([])
  const [tips, setTips] = useState<string[]>([])

  useEffect(() => {
    api.getTickets({ limit: 5 }).then(r => setTickets(r.data))
    api.getMyTicketCount().then(r => setReportCount(r.data.count))
    api.getMyBadges().then(r => setBadges(r.data))
    api.getLeaderboardUsers().then(r => setLeaders(r.data.slice(0, 10)))
    api.getMyRecommendations().then(r => setTips(r.data.tips))
  }, [])

  if (!user) return null

  const firstName = user.name.split(' ')[0]

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">

        {/* ── Hero header ── */}
        <div className="rounded-2xl p-5 md:p-6 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 60%, #065f46 100%)' }}>
          <div>
            <p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-1">Dashboard</p>
            <h1 className="text-xl md:text-2xl font-extrabold text-white">Hey, {firstName}! 👋</h1>
            <p className="text-green-300/70 text-sm mt-0.5">Keep making a difference 🌍</p>
          </div>
          <Link to="/report"
            className="flex-shrink-0 flex items-center gap-2 bg-green-400 hover:bg-green-300 text-green-900 font-bold px-4 py-2.5 rounded-xl text-sm transition-all"
            style={{ boxShadow: '0 4px 14px rgba(74,222,128,0.4)' }}>
            <span>📷</span> Report
          </Link>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Score gauge */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center card-hover"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <ScoreGauge score={Math.round(user.sustainability_score)} />
          </div>

          {/* Points + Reports */}
          <div className="grid grid-rows-2 gap-3">
            <div className="stat-green rounded-2xl border p-4 card-hover flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center text-xl">🌿</div>
              <div>
                <div className="text-2xl font-extrabold text-green-700">{user.total_points}</div>
                <div className="text-xs text-green-600/70 font-medium">Eco Points</div>
              </div>
            </div>
            <div className="stat-blue rounded-2xl border p-4 card-hover flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-xl">📋</div>
              <div>
                <div className="text-2xl font-extrabold text-blue-700">{reportCount ?? '…'}</div>
                <div className="text-xs text-blue-600/70 font-medium">Reports</div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 card-hover"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">🏅 Badges</h3>
            <BadgeShelf badges={badges} />
          </div>
        </div>

        {/* ── AI Tips ── */}
        {tips.length > 0 && (
          <div className="rounded-2xl border border-green-200 p-5"
            style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
            <h3 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-green-500/15 rounded-lg flex items-center justify-center">🤖</span>
              AI Recommendations
            </h3>
            <ul className="space-y-2">
              {tips.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                  <span className="text-green-400 mt-0.5">→</span> {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── My Recent Reports ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">My Recent Reports</h3>
            <Link to="/my-tickets" className="text-xs font-semibold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
              View all →
            </Link>
          </div>
          {tickets.length === 0
            ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-sm">No reports yet — be the first to report!</p>
              </div>
            )
            : <div className="space-y-3">{tickets.slice(0, 3).map(t => <TicketCard key={t.id} ticket={t} />)}</div>}
        </div>

        {/* ── Leaderboard ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <h3 className="font-bold text-gray-800 mb-4">🏆 Leaderboard</h3>
          <UserLeaderboard users={leaders} highlightId={user.id} compact />
        </div>

      </div>
    </DashboardLayout>
  )
}
