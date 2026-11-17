import { useEffect, useState } from 'react'
import DashboardLayout from '../layouts/DashboardLayout'
import { UserLeaderboard, LEVELS, getLevel } from '../components/Leaderboard'
import * as api from '../api'
import type { LeaderboardUser } from '../types'

// ── Level legend strip ───────────────────────────────────────────────────────
function LevelLegend() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Level Guide</h3>
      <div className="grid grid-cols-5 gap-2">
        {LEVELS.map(lvl => (
          <div key={lvl.name} className={`flex flex-col items-center gap-1 p-2 rounded-xl border ${lvl.bg} ${lvl.border}`}>
            <span className="text-xl">{lvl.icon}</span>
            <span className={`text-[10px] font-bold ${lvl.color}`}>{lvl.name}</span>
            <span className="text-[9px] text-gray-400">{lvl.min}+ score</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Stat chip ────────────────────────────────────────────────────────────────
function StatChip({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-3 bg-white/10 rounded-xl">
      <span className="text-xl">{icon}</span>
      <span className="text-white font-extrabold text-lg leading-none">{value}</span>
      <span className="text-green-300/70 text-[10px] font-medium">{label}</span>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])

  useEffect(() => {
    api.getLeaderboardUsers().then(r => setUsers(r.data))
  }, [])

  // Derive stats from merged list (use raw API data for real counts)
  const totalPoints = users.reduce((s, u) => s + u.total_points, 0)
  const topScore    = users.length ? Math.max(...users.map(u => u.sustainability_score)) : 0
  const legendCount = users.filter(u => getLevel(u.sustainability_score).name === 'Legend').length

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Hero banner ── */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 55%, #065f46 100%)' }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative z-10">
            <p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-1">Rankings</p>
            <h1 className="text-2xl font-extrabold text-white mb-1">🏆 Eco Leaderboard</h1>
            <p className="text-green-300/70 text-sm mb-4">Top contributors making a real difference.</p>

            {/* Quick stats */}
            <div className="flex gap-2 flex-wrap">
              <StatChip icon="👥" value={users.length || '—'} label="Real Players" />
              <StatChip icon="🌿" value={totalPoints || '—'} label="Total Points" />
              <StatChip icon="⚡" value={legendCount || '—'} label="Legends" />
              <StatChip icon="📈" value={topScore || '—'} label="Top Score" />
            </div>
          </div>
        </div>

        {/* ── Level legend ── */}
        <LevelLegend />

        {/* ── Full leaderboard ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-gray-800">👤 Top Contributors</span>
              <p className="text-[11px] text-gray-400 mt-0.5">Ranked by Eco Points · Level by Sustainability Score</p>
            </div>
            <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
              Top 15
            </span>
          </div>
          <div className="p-5">
            <UserLeaderboard users={users} />
          </div>
        </div>

        {/* ── Prototype disclaimer ── */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 flex items-start gap-2">
          <span className="mt-0.5 flex-shrink-0">⚠️</span>
          <span>
            <strong>Prototype Note:</strong> Some entries are demo data for visual testing only.
            Real rankings will reflect actual activity once the app is in live use.
          </span>
        </div>

      </div>
    </DashboardLayout>
  )
}
