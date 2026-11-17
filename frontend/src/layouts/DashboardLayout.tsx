import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { ReactNode } from 'react'

const NAV: Record<string, { label: string; path: string; icon: string }[]> = {
  student: [
    { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { label: 'Report', path: '/report', icon: '📷' },
    { label: 'My Tickets', path: '/my-tickets', icon: '🎫' },
    { label: 'Map', path: '/map', icon: '🗺️' },
    { label: 'Leaderboard', path: '/leaderboard', icon: '🏆' },
  ],
  admin: [
    { label: 'Admin', path: '/admin', icon: '⚙️' },
    { label: 'Map', path: '/map', icon: '🗺️' },
    { label: 'Analytics', path: '/analytics', icon: '📊' },
    { label: 'Leaderboard', path: '/leaderboard', icon: '🏆' },
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

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-60 flex-shrink-0 flex-col"
        style={{ background: 'linear-gradient(180deg, #052e16 0%, #064e3b 50%, #065f46 100%)' }}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-green-400/20 flex items-center justify-center text-lg">🌿</div>
            <div>
              <div className="text-white font-bold text-base tracking-tight">EcoLens</div>
              <div className="text-green-400/70 text-[10px]">Sustainability Platform</div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(l => {
            const active = location.pathname === l.path
            return (
              <Link key={l.path} to={l.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                  ${active
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-green-200/70 hover:bg-white/8 hover:text-white'}`}>
                <span className="text-base w-5 text-center">{l.icon}</span>
                {l.label}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400" />}
              </Link>
            )
          })}
        </nav>

        {/* User info */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/8 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {user.name[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{user.name}</div>
              <div className="text-[10px] text-green-400/70 capitalize">{user.role}</div>
            </div>
            <div className="text-xs font-bold text-green-300">{user.total_points}pts</div>
          </div>
          <button onClick={() => { logout(); navigate('/login') }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-300/70 hover:text-red-300 hover:bg-red-500/10 transition-colors">
            <span>🚪</span> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[1002] flex"
        style={{ background: 'rgba(5,46,22,0.97)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {links.map(l => {
          const active = location.pathname === l.path
          return (
            <Link key={l.path} to={l.path}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 text-[10px] font-medium transition-colors
                ${active ? 'text-green-400' : 'text-green-200/50'}`}>
              <span className={`text-xl leading-none mb-0.5 ${active ? 'scale-110' : ''} transition-transform`}>{l.icon}</span>
              <span className="truncate w-full text-center">{l.label}</span>
            </Link>
          )
        })}
        <button onClick={() => { logout(); navigate('/login') }}
          className="flex-1 flex flex-col items-center justify-center py-2.5 text-[10px] text-red-300/60 hover:text-red-300">
          <span className="text-xl leading-none mb-0.5">🚪</span>
          <span>Logout</span>
        </button>
      </nav>

    </div>
  )
}
