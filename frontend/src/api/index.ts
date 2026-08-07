import client from './client'
import type {
  Ticket, ClassifyResponse, LeaderboardUser, LeaderboardDepartment,
  UserBadge, HeatmapPoint, AnalyticsSummary, RouterSnapshot,
  SensorReading, AnomalyOut, Department
} from '../types'

export const login = (email: string, password: string) =>
  client.post<{ access_token: string }>('/auth/login', { email, password })

export const getMe = () => client.get('/auth/me')

export const classifyImage = (file: File) => {
  const form = new FormData()
  form.append('image', file)
  return client.post<ClassifyResponse>('/ai/classify', form)
}

export const createTicket = (data: FormData) =>
  client.post<Ticket>('/tickets', data)

export const getTickets = (params?: Record<string, string | number>) =>
  client.get<Ticket[]>('/tickets', { params })

export const getTicket = (id: number) =>
  client.get<Ticket>(`/tickets/${id}`)

export const updateTicketStatus = (id: number, status: string) =>
  client.patch<Ticket>(`/tickets/${id}/status`, { status })

export const getHeatmap = () =>
  client.get<HeatmapPoint[]>('/tickets/heatmap')

export const getLeaderboardUsers = (department_id?: number) =>
  client.get<LeaderboardUser[]>('/leaderboard/users', { params: { department_id } })

export const getLeaderboardDepts = () =>
  client.get<LeaderboardDepartment[]>('/leaderboard/departments')

export const getMyBadges = () =>
  client.get<UserBadge[]>('/users/me/badges')

export const getMyRecommendations = () =>
  client.get<{ tips: string[] }>('/users/me/recommendations')

export const getAnalytics = () =>
  client.get<AnalyticsSummary>('/analytics/summary')

export const getBuildings = (type?: string) =>
  client.get<Department[]>('/buildings', { params: type ? { type } : {} })

export const getRouterSnapshot = (deptId: number) =>
  client.get<RouterSnapshot>(`/buildings/${deptId}/router`)

export const getBuildingReadings = (deptId: number, metric: string, from?: string, to?: string) =>
  client.get<SensorReading[]>(`/buildings/${deptId}/readings`, { params: { metric, from_dt: from, to_dt: to } })

export const getResourceAnomalies = () =>
  client.get<AnomalyOut[]>('/ai/resource-anomalies')
