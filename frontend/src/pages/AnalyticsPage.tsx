import { useEffect, useState } from 'react'
import DashboardLayout from '../layouts/DashboardLayout'
import * as api from '../api'
import type { AnalyticsSummary } from '../types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer
} from 'recharts'

const CAT_COLORS: Record<string, string> = {
  organic: '#22c55e',
  recyclable: '#3b82f6',
  hazardous: '#ef4444',
  general_waste: '#6b7280',
  resource_wastage: '#f59e0b',
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null)

  useEffect(() => {
    api.getAnalytics().then(r => setData(r.data))
  }, [])

  if (!data) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64 text-gray-400">Loading analytics…</div>
    </DashboardLayout>
  )

  const catChartData = Object.entries(data.tickets_by_category).map(([k, v]) => ({
    name: k.replace('_', ' '), value: v, fill: CAT_COLORS[k] || '#94a3b8'
  }))

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">📊 Campus Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Tickets by Category (30 days)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={catChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly trend */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Weekly Trend (12 weeks)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.weekly_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="raised" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top problem zones */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-700 mb-4">🔴 Top Problem Zones</h3>
          <div className="space-y-3">
            {data.top_problem_zones.map((z, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
                  ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-400' : 'bg-yellow-400'}`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{z.department}</div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                    <div className="bg-red-400 h-2 rounded-full"
                      style={{ width: `${Math.min(z.open_tickets / 20 * 100, 100)}%` }} />
                  </div>
                </div>
                <div className="text-sm font-bold text-red-600">{z.open_tickets} open</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
