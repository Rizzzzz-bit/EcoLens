import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import LoginPage from './pages/LoginPage'
import StudentDashboard from './pages/StudentDashboard'
import ReportPage from './pages/ReportPage'
import MyTickets from './pages/MyTickets'
import AdminDashboard from './pages/AdminDashboard'
import LeaderboardPage from './pages/LeaderboardPage'
import AnalyticsPage from './pages/AnalyticsPage'
import CampusMap from './pages/CampusMap'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* User (Student) */}
          <Route element={<PrivateRoute allowedRoles={['student']} />}>
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/my-tickets" element={<MyTickets />} />
          </Route>

          {/* Admin */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>

          {/* Shared protected routes (all roles) */}
          <Route element={<PrivateRoute />}>
            <Route path="/report" element={<ReportPage />} />
            <Route path="/map" element={<CampusMap />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
