export interface User {
  id: number
  name: string
  email: string
  role: 'student' | 'staff' | 'dept_staff' | 'warden' | 'admin'
  department_id: number | null
  total_points: number
  sustainability_score: number
}

export interface Department {
  id: number
  name: string
  type: 'academic' | 'hostel'
  lat: number
  lng: number
}

export type TicketStatus = 'raised' | 'in_progress' | 'resolved'
export type TicketCategory = 'organic' | 'recyclable' | 'hazardous' | 'general_waste' | 'resource_wastage'

export interface Ticket {
  id: number
  reporter_id: number
  department_id: number
  category: TicketCategory
  action_recommendation: string
  eco_tip: string | null
  image_url: string | null
  lat: number
  lng: number
  status: TicketStatus
  ai_confidence: number | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  reporter?: User
  department?: Department
}

export interface ClassifyResponse {
  category: TicketCategory
  confidence: number
  action_recommendation: string
  eco_tip: string
}

export interface Badge {
  id: number
  name: string
  description: string
  threshold_points: number
  icon: string
}

export interface UserBadge {
  badge: Badge
  awarded_at: string
}

export interface LeaderboardUser {
  rank: number
  user_id: number
  name: string
  department: string | null
  total_points: number
  sustainability_score: number
}

export interface LeaderboardDepartment {
  rank: number
  department_id: number
  name: string
  type: string
  total_points: number
  member_count: number
}

export interface HeatmapPoint {
  lat: number
  lng: number
  weight: number
}

export interface AnalyticsSummary {
  tickets_by_category: Record<string, number>
  weekly_trend: { week: string; raised: number; resolved: number }[]
  top_problem_zones: { department: string; open_tickets: number }[]
}

export interface RouterSnapshot {
  department_id: number
  devices: number | null
  bandwidth: number | null
}

export interface SensorReading {
  recorded_at: string
  value: number
}

export interface AnomalyOut {
  department_id: number
  department_name: string
  metric: string
  recorded_at: string
  value: number
  expected_mean: number
  z_score: number
}
