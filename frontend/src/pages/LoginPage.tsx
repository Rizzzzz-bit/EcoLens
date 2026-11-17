import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await login(email, password)
      // AuthContext sets user; navigate based on role
      // We re-read from sessionStorage since user state updates async
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
    { label: 'User', email: 'user@ecolens.in' },
    { label: 'Admin', email: 'admin@ecolens.in' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🌿</div>
          <h1 className="text-3xl font-bold text-green-800">EcoLens</h1>
          <p className="text-green-600 mt-1">AI-Powered Campus Sustainability Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="you@ecolens.in" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="password123" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Quick demo logins */}
          <div className="mt-6 border-t pt-4">
            <p className="text-xs text-gray-400 mb-3 text-center">Quick demo logins (password: password123)</p>
            <div className="grid grid-cols-2 gap-2">
              {demoLogins.map(d => (
                <button key={d.email}
                  onClick={() => { setEmail(d.email); setPassword('password123') }}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 text-gray-600 text-left">
                  <div className="font-medium">{d.label}</div>
                  <div className="text-gray-400 truncate">{d.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
