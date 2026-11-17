import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ROLE_HOME: Record<string, string> = {
  student: '/dashboard',
  admin: '/admin',
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [slowDismissed, setSlowDismissed] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await login(email, password)
      const { getMe } = await import('../api')
      const r = await getMe()
      navigate(ROLE_HOME[r.data.role] || '/dashboard')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const demoLogins = [
    { label: 'User', email: 'user@ecolens.in', icon: '👤' },
    { label: 'Admin', email: 'admin@ecolens.in', icon: '⚙️' },
  ]

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-3 relative z-10">

        {/* Free-tier notice */}
        {!slowDismissed && (
          <div className="glass rounded-2xl px-4 py-3 flex items-start gap-3 border border-amber-200/60 bg-amber-50/80">
            <span className="text-lg flex-shrink-0">🐢</span>
            <div className="flex-1 text-xs text-amber-800">
              <p className="font-semibold mb-0.5">Heads up — we're on the free tier!</p>
              <p className="text-amber-700/80">Hosted on Render's free plan — the server loves its beauty sleep. ☕ Give it 10–15 sec on first load!</p>
            </div>
            <button onClick={() => setSlowDismissed(true)}
              className="text-amber-400 hover:text-amber-600 flex-shrink-0 text-base leading-none mt-0.5">✕</button>
          </div>
        )}

        {/* Logo */}
        <div className="text-center pt-4 pb-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3"
            style={{ background: 'linear-gradient(135deg, #16a34a, #059669)', boxShadow: '0 8px 32px rgba(22,163,74,0.3)' }}>
            <span className="text-3xl">🌿</span>
          </div>
          <h1 className="text-3xl font-extrabold gradient-text">EcoLens</h1>
          <p className="text-gray-500 text-sm mt-1">AI-Powered Sustainability Platform</p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl shadow-xl p-7" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
          <h2 className="text-lg font-bold text-gray-800 mb-5">Welcome back 👋</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="input-modern w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50/50"
                placeholder="you@ecolens.in" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="input-modern w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50/50"
                placeholder="••••••••" />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-600">
                <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60"
              style={{ background: loading ? '#86efac' : 'linear-gradient(135deg, #16a34a, #059669)', boxShadow: loading ? 'none' : '0 4px 15px rgba(22,163,74,0.35)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            New here?{' '}
            <Link to="/signup" className="font-semibold text-green-600 hover:text-green-700">Create an account</Link>
          </div>

          {/* Demo logins */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 text-center mb-2.5 font-medium uppercase tracking-wide">Quick Demo Login</p>
            <div className="grid grid-cols-2 gap-2">
              {demoLogins.map(d => (
                <button key={d.email}
                  onClick={() => { setEmail(d.email); setPassword('password123') }}
                  className="card-hover flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 hover:border-green-300 hover:bg-green-50/50 text-left transition-all">
                  <span className="text-lg">{d.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-gray-700">{d.label}</div>
                    <div className="text-[10px] text-gray-400 truncate">{d.email}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
