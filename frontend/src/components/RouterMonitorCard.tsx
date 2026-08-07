import { useEffect, useState } from 'react'
import type { RouterSnapshot } from '../types'
import * as api from '../api'
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'

interface Props { deptId: number }

export default function RouterMonitorCard({ deptId }: Props) {
  const [snap, setSnap] = useState<RouterSnapshot | null>(null)

  const fetch = () =>
    api.getRouterSnapshot(deptId).then(r => setSnap(r.data)).catch(() => {})

  useEffect(() => {
    fetch()
    const id = setInterval(fetch, 30_000)
    return () => clearInterval(id)
  }, [deptId])

  if (!snap) return null

  const bw = snap.bandwidth ?? 0
  const devices = snap.devices ?? 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">📡 Network Monitor</h3>
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{Math.round(devices)}</div>
          <div className="text-xs text-gray-500 mt-1">Devices Connected</div>
        </div>
        <div style={{ width: 80, height: 80 }}>
          <ResponsiveContainer>
            <RadialBarChart cx="50%" cy="50%" innerRadius="55%" outerRadius="90%"
              startAngle={90} endAngle={-270}
              data={[{ value: Math.min(bw, 500), fill: '#6366f1' }]}
            >
              <PolarAngleAxis type="number" domain={[0, 500]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#f3f4f6' }} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{bw.toFixed(0)}</div>
          <div className="text-xs text-gray-500 mt-1">Mbps Bandwidth</div>
        </div>
      </div>
    </div>
  )
}
