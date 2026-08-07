import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ROLE_HOME: Record<string, string> = {
  student: '/dashboard',
  staff: '/dashboard',
  dept_staff: '/dept',
  warden: '/warden',
  admin: '/admin',
}

interface Props {
  allowedRoles?: string[]
}

export default function PrivateRoute({ allowedRoles }: Props) {
  const { user, loading } = useAuth()

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] || '/dashboard'} replace />
  }
  return <Outlet />
}
