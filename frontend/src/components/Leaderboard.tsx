import type { LeaderboardUser } from '../types'

// Fake individuals shown when real API data is sparse
const FAKE_USERS: LeaderboardUser[] = [
  { rank: 0, user_id: -1,  name: 'Aarav Sharma',   department: null, total_points: 340, sustainability_score: 88 },
  { rank: 0, user_id: -2,  name: 'Priya Mehta',    department: null, total_points: 295, sustainability_score: 81 },
  { rank: 0, user_id: -3,  name: 'Rohan Verma',    department: null, total_points: 260, sustainability_score: 76 },
  { rank: 0, user_id: -4,  name: 'Sneha Kapoor',   department: null, total_points: 220, sustainability_score: 70 },
  { rank: 0, user_id: -5,  name: 'Arjun Nair',     department: null, total_points: 185, sustainability_score: 65 },
  { rank: 0, user_id: -6,  name: 'Divya Iyer',     department: null, total_points: 150, sustainability_score: 58 },
  { rank: 0, user_id: -7,  name: 'Karan Joshi',    department: null, total_points: 120, sustainability_score: 50 },
  { rank: 0, user_id: -8,  name: 'Ananya Singh',   department: null, total_points: 95,  sustainability_score: 44 },
  { rank: 0, user_id: -9,  name: 'Vikram Patel',   department: null, total_points: 70,  sustainability_score: 38 },
  { rank: 0, user_id: -10, name: 'Meera Reddy',    department: null, total_points: 45,  sustainability_score: 30 },
]

/** Merges real users with fake ones, deduplicates, re-ranks, returns top 15. */
function mergeAndRank(real: LeaderboardUser[]): LeaderboardUser[] {
  // Only keep fake entries that don't clash with a real user's name
  const realNames = new Set(real.map(u => u.name.toLowerCase()))
  const fakes = FAKE_USERS.filter(f => !realNames.has(f.name.toLowerCase()))

  return [...real, ...fakes]
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, 15)
    .map((u, i) => ({ ...u, rank: i + 1 }))
}

interface UserProps { users: LeaderboardUser[]; highlightId?: number }

export function UserLeaderboard({ users, highlightId }: UserProps) {
  const merged = mergeAndRank(users)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="pb-2 w-8">#</th>
            <th className="pb-2">Name</th>
            <th className="pb-2 text-right">Points</th>
            <th className="pb-2 text-right">Score</th>
          </tr>
        </thead>
        <tbody>
          {merged.map(u => (
            <tr key={u.user_id}
              className={`border-b last:border-0 ${u.user_id === highlightId ? 'bg-green-50 font-semibold' : ''}`}>
              <td className="py-2 text-gray-400">
                {u.rank <= 3 ? ['🥇', '🥈', '🥉'][u.rank - 1] : u.rank}
              </td>
              <td className="py-2">{u.name}</td>
              <td className="py-2 text-right font-mono text-green-700">{u.total_points}</td>
              <td className="py-2 text-right text-blue-600">{u.sustainability_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
