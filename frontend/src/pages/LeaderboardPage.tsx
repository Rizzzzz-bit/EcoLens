import { useEffect, useState } from 'react'
import DashboardLayout from '../layouts/DashboardLayout'
import { UserLeaderboard } from '../components/Leaderboard'
import * as api from '../api'
import type { LeaderboardUser } from '../types'

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])

  useEffect(() => {
    api.getLeaderboardUsers().then(r => setUsers(r.data))
  }, [])

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4 md:space-y-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">🏆 Leaderboard</h1>
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="px-5 py-3 border-b">
            <span className="text-sm font-medium text-green-700">👤 Top Contributors</span>
          </div>
          <div className="p-5">
            <UserLeaderboard users={users} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
