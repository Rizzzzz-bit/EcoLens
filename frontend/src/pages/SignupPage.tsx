import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import * as api from '../api'

export default function SignupPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    try {
      await api.signup(name, email, password)
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      setError(detail === 'Email already registered'
        ? 'This email is already registered. Try logging in.'
        : 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { label: 'Full Name', type: 'text', value: name, onChange: (v: string) => setName(v), placeholder: 'Your name' },
    { label: 'Email', type: 'email', value: email, onChange: (v: string) => setEmail(v), placeholder: 'you@example.com' },
    { label: 'Password', type: 'password', value: password, onChange: (v: string) => setPassword(v), placeholder: 'Min. 6 characters' },
    { label: 'Confirm Password', type: 'password', value: confirm, onChange: (v: string) => setConfirm(v), placeholder: 'Repeat password' },
  ]

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-3 relative z-10">

        {/* Logo */}
        <div className="text-center pt-2 pb-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-2"
            style={{ background: 'linear-gradient(135deg, #16a34a, #059669)', boxShadow: '0 8px 32px rgba(22,163,74,0.3)' }}>
            <span className="text-2xl">🌿</span>
          </div>
          <h1 className="text-2xl font-extrabold gradient-text">Join EcoLens</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account and start making an impact</p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-7" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {fields.map(f => (
              <div key={f.label}>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{f.label}</label>
                <input
                  type={f.type} value={f.value}
                  onChange={e => f.onChange(e.target.value)} required
                  className="input-modern w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50/50"
                  placeholder={f.placeholder}
                />
              </div>
            ))}

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-600">
                <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 mt-1"
              style={{ background: loading ? '#86efac' : 'linear-gradient(135deg, #16a34a, #059669)', boxShadow: loading ? 'none' : '0 4px 15px rgba(22,163,74,0.35)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating account…
                </span>
              ) : 'Create Account →'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-green-600 hover:text-green-700">Sign in</Link>
          </div>
        </div>

      </div>
    </div>
  )
}
