import type { LeaderboardUser } from '../types'

// ── Level system (based on sustainability_score 0–100) ───────────────────────
export interface Level {
  name: string
  icon: string
  min: number        // inclusive lower bound of score
  color: string      // text colour
  bg: string         // badge background
  border: string     // badge border
  barColor: string   // progress bar fill
}

export const LEVELS: Level[] = [
  { name: 'Seedling',  icon: '🌱', min: 0,  color: 'text-gray-600',   bg: 'bg-gray-100',    border: 'border-gray-200',   barColor: '#9ca3af' },
  { name: 'Sprout',    icon: '🌿', min: 25, color: 'text-lime-700',   bg: 'bg-lime-100',    border: 'border-lime-200',   barColor: '#84cc16' },
  { name: 'Guardian',  icon: '🌳', min: 50, color: 'text-green-700',  bg: 'bg-green-100',   border: 'border-green-200',  barColor: '#22c55e' },
  { name: 'Champion',  icon: '🔥', min: 70, color: 'text-orange-700', bg: 'bg-orange-100',  border: 'border-orange-200', barColor: '#f97316' },
  { name: 'Legend',    icon: '⚡', min: 90, color: 'text-purple-700', bg: 'bg-purple-100',  border: 'border-purple-200', barColor: '#a855f7' },
]

export function getLevel(score: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].min) return LEVELS[i]
  }
  return LEVELS[0]
}

// ── Demo data ────────────────────────────────────────────────────────────────
const FAKE_USERS: LeaderboardUser[] = [
  { rank: 0, user_id: -1,  name: 'Aarav Sharma',   department: 'CSE',       total_points: 340, sustainability_score: 92 },
  { rank: 0, user_id: -2,  name: 'Priya Mehta',    department: 'ECE',       total_points: 295, sustainability_score: 81 },
  { rank: 0, user_id: -3,  name: 'Rohan Verma',    department: 'ME',        total_points: 260, sustainability_score: 76 },
  { rank: 0, user_id: -4,  name: 'Sneha Kapoor',   department: 'Civil',     total_points: 220, sustainability_score: 70 },
  { rank: 0, user_id: -5,  name: 'Arjun Nair',     department: 'CSE',       total_points: 185, sustainability_score: 65 },
  { rank: 0, user_id: -6,  name: 'Divya Iyer',     department: 'BCA',       total_points: 150, sustainability_score: 58 },
  { rank: 0, user_id: -7,  name: 'Karan Joshi',    department: 'MBA',       total_points: 120, sustainability_score: 50 },
  { rank: 0, user_id: -8,  name: 'Ananya Singh',   department: 'BBA',       total_points: 95,  sustainability_score: 44 },
  { rank: 0, user_id: -9,  name: 'Vikram Patel',   department: 'Physics',   total_points: 70,  sustainability_score: 38 },
  { rank: 0, user_id: -10, name: 'Meera Reddy',    department: 'Chemistry', total_points: 45,  sustainability_score: 30 },
]

/** Merges real users with fake ones, deduplicates, re-ranks, returns top 15.
 *  Real users always take priority — fake entries are only shown to fill empty spots.
 *  The current logged-in user's rank is taken from the backend (not re-computed here)
 *  so the dashboard rank stat card is unaffected by this merge.
 */
function mergeAndRank(real: LeaderboardUser[]): LeaderboardUser[] {
  const realNames = new Set(real.map(u => u.name.toLowerCase()))
  const fakes = FAKE_USERS.filter(f => !realNames.has(f.name.toLowerCase()))
  return [...real, ...fakes]
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, 15)
    .map((u, i) => ({ ...u, rank: i + 1 }))
}

// ── Avatar initials ──────────────────────────────────────────────────────────
function Avatar({ name, rank }: { name: string; rank: number }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const palettes = [
    'from-green-400 to-emerald-600',
    'from-blue-400 to-indigo-600',
    'from-purple-400 to-pink-600',
    'from-orange-400 to-red-500',
    'from-teal-400 to-cyan-600',
  ]
  const gradient = palettes[Math.abs(rank) % palettes.length]
  return (
    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
      {initials}
    </div>
  )
}

// ── Level badge pill ─────────────────────────────────────────────────────────
function LevelBadge({ score }: { score: number }) {
  const lvl = getLevel(score)
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${lvl.bg} ${lvl.color} ${lvl.border}`}>
      {lvl.icon} {lvl.name}
    </span>
  )
}

// ── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const lvl = getLevel(score)
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${score}%`, backgroundColor: lvl.barColor }}
      />
    </div>
  )
}

// ── Podium card (top 3) ──────────────────────────────────────────────────────
const PODIUM_META = [
  { medal: '🥇', label: '1st',  ring: 'ring-2 ring-yellow-400', bg: 'bg-yellow-50',  border: 'border-yellow-200', order: 'order-2', size: 'w-10 h-10 text-sm', nameSize: 'text-sm' },
  { medal: '🥈', label: '2nd',  ring: 'ring-2 ring-gray-300',   bg: 'bg-gray-50',    border: 'border-gray-200',   order: 'order-1', size: 'w-9 h-9 text-xs',  nameSize: 'text-xs' },
  { medal: '🥉', label: '3rd',  ring: 'ring-2 ring-orange-300', bg: 'bg-orange-50',  border: 'border-orange-200', order: 'order-3', size: 'w-9 h-9 text-xs',  nameSize: 'text-xs' },
]

function PodiumCard({ user, podiumIdx, highlightId }: { user: LeaderboardUser; podiumIdx: number; highlightId?: number }) {
  const m   = PODIUM_META[podiumIdx]
  const lvl = getLevel(user.sustainability_score)
  const isMe = user.user_id === highlightId
  return (
    <div className={`${m.order} flex flex-col items-center gap-1.5 flex-1 min-w-0`}>
      <div className="relative">
        {/* Avatar */}
        <div className={`${m.size} rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold ${m.ring} ${isMe ? 'ring-green-500' : ''} shadow`}>
          {user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        {/* Medal overlay */}
        <span className="absolute -bottom-1 -right-1 text-base leading-none">{m.medal}</span>
      </div>
      <div className={`text-center px-1 py-1.5 rounded-xl border w-full ${m.bg} ${m.border} ${isMe ? 'ring-1 ring-green-400' : ''}`}>
        <div className={`font-bold text-gray-800 truncate ${m.nameSize}`}>{user.name.split(' ')[0]}</div>
        <div className="text-[10px] text-gray-500 truncate">{user.department ?? '—'}</div>
        <div className={`font-extrabold text-green-700 mt-0.5 ${podiumIdx === 0 ? 'text-sm' : 'text-xs'}`}>{user.total_points} pts</div>
        <LevelBadge score={user.sustainability_score} />
      </div>
      {/* Podium bar */}
      <div className={`w-full rounded-t-lg ${podiumIdx === 0 ? 'h-10 bg-yellow-200' : podiumIdx === 1 ? 'h-6 bg-gray-200' : 'h-4 bg-orange-200'}`} />
    </div>
  )
}

// ── Main exported component ──────────────────────────────────────────────────
interface UserProps { users: LeaderboardUser[]; highlightId?: number; compact?: boolean }

export function UserLeaderboard({ users, highlightId, compact = false }: UserProps) {
  const merged = mergeAndRank(users)
  const top3   = merged.slice(0, 3)
  const rest   = merged.slice(3)

  if (compact) {
    // Compact table used inside StudentDashboard
    return (
      <div className="space-y-1.5">
        {merged.map(u => {
          const lvl  = getLevel(u.sustainability_score)
          const isMe = u.user_id === highlightId
          return (
            <div key={u.user_id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors
                ${isMe ? 'bg-green-50 border border-green-200' : 'hover:bg-gray-50'}`}>
              {/* Rank */}
              <div className="w-6 text-center flex-shrink-0">
                {u.rank <= 3
                  ? <span className="text-base">{['🥇','🥈','🥉'][u.rank-1]}</span>
                  : <span className="text-xs font-bold text-gray-400">{u.rank}</span>}
              </div>
              {/* Avatar */}
              <Avatar name={u.name} rank={u.rank} />
              {/* Name + level */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">{u.name}</div>
                <LevelBadge score={u.sustainability_score} />
              </div>
              {/* Points */}
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-green-700">{u.total_points}</div>
                <div className="text-[10px] text-gray-400">pts</div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Full leaderboard view used in LeaderboardPage
  return (
    <div className="space-y-6">

      {/* ── Podium ── */}
      <div className="flex items-end gap-3 px-2">
        {top3.map((u, i) => (
          <PodiumCard key={u.user_id} user={u} podiumIdx={i} highlightId={highlightId} />
        ))}
      </div>

      {/* ── Ranks 4–15 ── */}
      <div className="space-y-2">
        {rest.map(u => {
          const lvl  = getLevel(u.sustainability_score)
          const isMe = u.user_id === highlightId
          return (
            <div key={u.user_id}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all
                ${isMe
                  ? 'border-green-300 bg-green-50 shadow-sm'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'}`}>
              {/* Rank number */}
              <div className="w-7 text-center flex-shrink-0">
                <span className="text-sm font-bold text-gray-400">#{u.rank}</span>
              </div>
              {/* Avatar */}
              <Avatar name={u.name} rank={u.rank} />
              {/* Name + dept + score bar */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-800 truncate">{u.name}</span>
                  {u.department && (
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">{u.department}</span>
                  )}
                  {isMe && <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">You</span>}
                </div>
                <ScoreBar score={u.sustainability_score} />
              </div>
              {/* Level + points */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <LevelBadge score={u.sustainability_score} />
                <span className="text-sm font-bold text-green-700">{u.total_points} <span className="text-xs font-normal text-gray-400">pts</span></span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
