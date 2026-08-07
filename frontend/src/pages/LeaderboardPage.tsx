import { useEffect, useState } from 'react'
import DashboardLayout from '../layouts/DashboardLayout'
import { UserLeaderboard, DeptLeaderboard } from '../components/Leaderboard'
import * as api from '../api'
import type { LeaderboardUser, LeaderboardDepartment } from '../types'

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [depts, setDepts] = useState<LeaderboardDepartment[]>([])
  const [tab, setTab] = useState<'users' | 'departments'>('users')

  useEffect(() => {
    api.getLeaderboardUsers().then(r => setUsers(r.data))
    api.getLeaderboardDepts().then(r => setDepts(r.data))
  }, [])

  return (
    <DashboardLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">🏆 Campus Leaderboard</h1>
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="flex border-b">
            {(['users', 'departments'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors
                  ${tab === t ? 'border-green-500 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t === 'users' ? '👤 Individuals' : '🏢 Departments'}
              </button>
            ))}
          </div>
          <div className="p-5">
            {tab === 'users' ? <UserLeaderboard users={users} /> : <DeptLeaderboard departments={depts} />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
