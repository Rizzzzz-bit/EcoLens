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

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Welcome, {user.name.split(' ')[0]}! 👋</h1>
            <p className="text-sm text-gray-500">Your campus sustainability dashboard</p>
          </div>
          <Link to="/report" className="bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm font-semibold px-3 py-2 rounded-xl">
            📷 Report
          </Link>
        </div>

        {/* Score + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white rounded-2xl shadow-sm border p-5 flex flex-col items-center">
            <ScoreGauge score={Math.round(user.sustainability_score)} />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-5 flex flex-col justify-center gap-4">
            <div>
              <div className="text-3xl font-bold text-green-700">{user.total_points}</div>
              <div className="text-sm text-gray-500">Total Eco Points</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">{reportCount ?? '…'}</div>
              <div className="text-sm text-gray-500">Reports Submitted</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">🏅 Badges</h3>
            <BadgeShelf badges={badges} />
          </div>
        </div>

        {/* AI Tips */}
        {tips.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-green-800 mb-3">🤖 AI Recommendations for You</h3>
            <ul className="space-y-2">
              {tips.map((t, i) => (
                <li key={i} className="text-sm text-green-700">{t}</li>
              ))}
            </ul>
          </div>
        )}

        {/* My Tickets */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">My Recent Reports</h3>
            <Link to="/my-tickets" className="text-xs text-green-600 hover:underline">View all</Link>
          </div>
          {tickets.length === 0
            ? <p className="text-sm text-gray-400 italic">No reports yet — be the first to report!</p>
            : <div className="space-y-3">{tickets.slice(0, 3).map(t => <TicketCard key={t.id} ticket={t} />)}</div>}
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-800 mb-4">🏆 Campus Leaderboard</h3>
          <UserLeaderboard users={leaders} highlightId={user.id} />
        </div>
      </div>
    </DashboardLayout>
  )
}
