import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import ScoreGauge from '../components/ScoreGauge'
import BadgeShelf from '../components/BadgeShelf'
import TicketCard from '../components/TicketCard'
import { UserLeaderboard, getLevel } from '../components/Leaderboard'
import * as api from '../api'
import type { Ticket, UserBadge, LeaderboardUser } from '../types'

// ── Greeting by time of day ──────────────────────────────────────────────────
function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
}

// ── Quick action button ───────────────────────────────────────────────────────
function QuickAction({ to, icon, label, accent }: { to: string; icon: string; label: string; accent: string }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1.5 flex-1 py-3 rounded-xl border transition-all hover:shadow-sm active:scale-95 ${accent}`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[11px] font-semibold">{label}</span>
    </Link>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
interface StatProps {
  icon: string; value: string | number; label: string
  bg: string; border: string; text: string; iconBg: string
  loading?: boolean
}
function StatCard({ icon, value, label, bg, border, text, iconBg, loading }: StatProps) {
  return (
    <div className={`rounded-2xl border p-4 card-hover flex items-center gap-3 ${bg} ${border}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        {loading
          ? <Skeleton className="h-6 w-12 mb-1" />
          : <div className={`text-2xl font-extrabold leading-none ${text}`}>{value}</div>
        }
        <div className={`text-xs font-medium mt-1 ${text} opacity-70`}>{label}</div>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { user } = useAuth()
  const [tickets,     setTickets]     = useState<Ticket[]>([])
  const [reportCount, setReportCount] = useState<number | null>(null)
  const [badges,      setBadges]      = useState<UserBadge[]>([])
  const [leaders,     setLeaders]     = useState<LeaderboardUser[]>([])
  const [tips,        setTips]        = useState<string[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      api.getTickets({ limit: 5 }).then(r => setTickets(r.data)),
      api.getMyTicketCount().then(r => setReportCount(r.data.count)),
      api.getMyBadges().then(r => setBadges(r.data)),
      // fetch up to 200 so current user's rank is always found, then show top-10 in preview
      api.getLeaderboardUsers(undefined, 200).then(r => setLeaders(r.data)),
      api.getMyRecommendations().then(r => setTips(r.data.tips)),
    ]).finally(() => setLoading(false))
  }, [])

  if (!user) return null

  const firstName = user.name.split(' ')[0]
  const level     = getLevel(user.sustainability_score)

  // Rank from backend list only (before fake users are merged in Leaderboard component)
  const myRank = leaders.find(l => l.user_id === user.id)?.rank ?? null

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">

        {/* ── Hero banner ── */}
        <div
          className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 55%, #065f46 100%)' }}
        >
          {/* Decorative blobs */}
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-1">
                {greeting()}
              </p>
              <h1 className="text-xl md:text-2xl font-extrabold text-white">
                {firstName}! 👋
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${level.bg} ${level.color} ${level.border}`}>
                  {level.icon} {level.name}
                </span>
                <span className="text-green-300/60 text-xs">·</span>
                <span className="text-green-300/70 text-xs font-medium">{user.total_points} pts</span>
              </div>
            </div>
            <Link
              to="/report"
              className="flex-shrink-0 flex items-center gap-2 bg-green-400 hover:bg-green-300 text-green-900 font-bold px-4 py-2.5 rounded-xl text-sm transition-all"
              style={{ boxShadow: '0 4px 14px rgba(74,222,128,0.4)' }}
            >
              <span>📷</span> Report
            </Link>
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div className="flex gap-2">
          <QuickAction to="/report"      icon="📷" label="Report"      accent="bg-green-50 border-green-200 text-green-700" />
          <QuickAction to="/my-tickets"  icon="🎫" label="My Tickets"  accent="bg-blue-50 border-blue-200 text-blue-700" />
          <QuickAction to="/map"         icon="🗺️" label="Map"         accent="bg-amber-50 border-amber-200 text-amber-700" />
          <QuickAction to="/leaderboard" icon="🏆" label="Leaderboard" accent="bg-purple-50 border-purple-200 text-purple-700" />
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon="🌱" value={Math.round(user.sustainability_score)} label="Eco Score"
            bg="stat-green" border="border-green-100" text="text-green-700" iconBg="bg-green-500/15"
          />
          <StatCard
            icon="🌿" value={user.total_points} label="Eco Points"
            bg="stat-green" border="border-green-100" text="text-green-700" iconBg="bg-green-500/15"
          />
          <StatCard
            icon="📋" value={reportCount ?? '…'} label="Reports"
            bg="stat-blue" border="border-blue-100" text="text-blue-700" iconBg="bg-blue-500/15"
            loading={reportCount === null}
          />
          <StatCard
            icon="🏆" value={myRank ? `#${myRank}` : '—'} label="Rank"
            bg="stat-purple" border="border-purple-100" text="text-purple-700" iconBg="bg-purple-500/15"
            loading={loading && myRank === null}
          />
        </div>

        {/* ── Two-column layout on desktop ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* ── Left column (2/3 width) ── */}
          <div className="md:col-span-2 space-y-5">

            {/* Score gauge + level */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 self-start">🌱 Sustainability Score</h3>
              <ScoreGauge score={Math.round(user.sustainability_score)} />
            </div>

            {/* AI Tips */}
            {(loading || tips.length > 0) && (
              <div className="rounded-2xl border border-green-200 p-5 space-y-3"
                style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
                <h3 className="text-sm font-bold text-green-800 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-500/15 rounded-lg flex items-center justify-center text-sm">🤖</span>
                  AI Recommendations
                </h3>
                {loading
                  ? <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
                  : (
                    <div className="space-y-2">
                      {tips.map((t, i) => (
                        <div key={i} className="flex items-start gap-3 bg-white/60 rounded-xl p-3 border border-green-100">
                          <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm text-green-800 leading-snug">{t}</p>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            )}

            {/* Recent Reports */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">📋 Recent Reports</h3>
                <Link
                  to="/my-tickets"
                  className="text-xs font-semibold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  View all →
                </Link>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <div className="text-5xl">📭</div>
                  <p className="text-sm font-medium text-gray-500">No reports yet</p>
                  <p className="text-xs text-gray-400">Be the first on campus to make a difference!</p>
                  <Link
                    to="/report"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors"
                  >
                    📷 Submit your first report
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.slice(0, 3).map(t => <TicketCard key={t.id} ticket={t} />)}
                </div>
              )}
            </div>
          </div>

          {/* ── Right column (1/3 width) ── */}
          <div className="space-y-5">

            {/* Badges */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">🏅 Badges</h3>
                {badges.length > 0 && (
                  <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {badges.length} earned
                  </span>
                )}
              </div>
              {loading
                ? <div className="flex flex-wrap gap-2">{[1,2,3].map(i => <Skeleton key={i} className="w-16 h-20" />)}</div>
                : <BadgeShelf badges={badges} max={6} />
              }
            </div>

            {/* Leaderboard preview */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">🏆 Leaderboard</h3>
                <Link
                  to="/leaderboard"
                  className="text-xs font-semibold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Full board →
                </Link>
              </div>
              {loading
                ? <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
                : <UserLeaderboard users={leaders.slice(0, 10)} highlightId={user.id} compact />
              }
            </div>

          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
