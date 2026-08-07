import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { ReactNode } from 'react'

const NAV: Record<string, { label: string; path: string; icon: string }[]> = {
  student: [
    { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { label: 'Report Issue', path: '/report', icon: '📷' },
    { label: 'My Tickets', path: '/my-tickets', icon: '🎫' },
    { label: 'Campus Map', path: '/map', icon: '🗺️' },
    { label: 'Leaderboard', path: '/leaderboard', icon: '🏆' },
  ],
  staff: [
    { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { label: 'Report Issue', path: '/report', icon: '📷' },
    { label: 'My Tickets', path: '/my-tickets', icon: '🎫' },
    { label: 'Campus Map', path: '/map', icon: '🗺️' },
    { label: 'Leaderboard', path: '/leaderboard', icon: '🏆' },
  ],
  dept_staff: [
    { label: 'Dept Portal', path: '/dept', icon: '🏢' },
    { label: 'Report Issue', path: '/report', icon: '📷' },
    { label: 'Campus Map', path: '/map', icon: '🗺️' },
    { label: 'Leaderboard', path: '/leaderboard', icon: '🏆' },
  ],
  warden: [
    { label: 'Warden Portal', path: '/warden', icon: '🏠' },
    { label: 'Report Issue', path: '/report', icon: '📷' },
    { label: 'Campus Map', path: '/map', icon: '🗺️' },
    { label: 'Leaderboard', path: '/leaderboard', icon: '🏆' },
  ],
  admin: [
    { label: 'Admin', path: '/admin', icon: '⚙️' },
    { label: 'Campus Map', path: '/map', icon: '🗺️' },
    { label: 'Analytics', path: '/analytics', icon: '📊' },
    { label: 'Leaderboard', path: '/leaderboard', icon: '🏆' },
    { label: 'Report Issue', path: '/report', icon: '📷' },
  ],
}

interface Props { children: ReactNode }

export default function DashboardLayout({ children }: Props) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (!user) return null
  const links = NAV[user.role] || NAV.student

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="text-lg font-bold text-green-700">🌿 EcoCSJMU</div>
          <div className="text-xs text-gray-500 mt-0.5">Sustainability Platform</div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map(l => (
            <Link
              key={l.path}
              to={l.path}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                ${location.pathname === l.path
                  ? 'bg-green-50 text-green-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span>{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-gray-50 mb-2">
            <div className="w-7 h-7 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold text-green-800">
              {user.name[0]}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-800 truncate">{user.name}</div>
              <div className="text-xs text-gray-400">{user.role.replace('_', ' ')}</div>
            </div>
            <div className="ml-auto text-xs font-bold text-green-700">{user.total_points}pts</div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="w-full text-xs text-gray-400 hover:text-red-500 text-left px-2 py-1"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}

        {/* Floating report button */}
        <Link
          to="/report"
          className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white rounded-full w-14 h-14 flex items-center justify-center text-2xl shadow-lg transition-colors z-50"
          title="Report an issue"
        >
          📷
        </Link>
      </main>
    </div>
  )
}
