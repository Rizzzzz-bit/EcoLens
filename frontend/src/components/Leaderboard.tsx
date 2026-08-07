import type { LeaderboardUser, LeaderboardDepartment } from '../types'

interface UserProps { users: LeaderboardUser[]; highlightId?: number }
interface DeptProps { departments: LeaderboardDepartment[] }

export function UserLeaderboard({ users, highlightId }: UserProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="pb-2 w-8">#</th>
            <th className="pb-2">Name</th>
            <th className="pb-2">Department</th>
            <th className="pb-2 text-right">Points</th>
            <th className="pb-2 text-right">Score</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.user_id} className={`border-b last:border-0 ${u.user_id === highlightId ? 'bg-green-50 font-semibold' : ''}`}>
              <td className="py-2 text-gray-400">{u.rank <= 3 ? ['🥇','🥈','🥉'][u.rank-1] : u.rank}</td>
              <td className="py-2">{u.name}</td>
              <td className="py-2 text-gray-500 text-xs">{u.department || '—'}</td>
              <td className="py-2 text-right font-mono text-green-700">{u.total_points}</td>
              <td className="py-2 text-right text-blue-600">{u.sustainability_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DeptLeaderboard({ departments }: DeptProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="pb-2 w-8">#</th>
            <th className="pb-2">Department</th>
            <th className="pb-2">Type</th>
            <th className="pb-2 text-right">Members</th>
            <th className="pb-2 text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {departments.map(d => (
            <tr key={d.department_id} className="border-b last:border-0">
              <td className="py-2 text-gray-400">{d.rank <= 3 ? ['🥇','🥈','🥉'][d.rank-1] : d.rank}</td>
              <td className="py-2">{d.name}</td>
              <td className="py-2 text-xs text-gray-500">{d.type}</td>
              <td className="py-2 text-right">{d.member_count}</td>
              <td className="py-2 text-right font-mono text-green-700">{d.total_points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
