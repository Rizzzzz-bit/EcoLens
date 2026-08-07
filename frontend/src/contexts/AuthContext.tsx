import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User } from '../types'
import * as api from '../api'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('eco_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      api.getMe()
        .then(r => setUser(r.data))
        .catch(() => { sessionStorage.removeItem('eco_token'); setToken(null) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (email: string, password: string) => {
    const r = await api.login(email, password)
    const t = r.data.access_token
    sessionStorage.setItem('eco_token', t)
    setToken(t)
    const me = await api.getMe()
    setUser(me.data)
  }

  const logout = () => {
    sessionStorage.removeItem('eco_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
