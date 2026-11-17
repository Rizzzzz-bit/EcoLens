import React, { useEffect, useState, useMemo } from 'react'
import DashboardLayout from '../layouts/DashboardLayout'
import * as api from '../api'
import type { AnalyticsSummary } from '../types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  LineChart, Line, ResponsiveContainer, Cell, Legend,
  PieChart, Pie,
} from 'recharts'

// ── Category metadata ─────────────────────────────────────────────────────────
const CAT_META: Record<string, { label: string; icon: string; color: string; bg: string; text: string; border: string }> = {
  organic:          { label: 'Organic',          icon: '🌿', color: '#16a34a', bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  recyclable:       { label: 'Recyclable',       icon: '♻️', color: '#2563eb', bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'  },
  hazardous:        { label: 'Hazardous',        icon: '⚠️', color: '#dc2626', bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200'   },
  general_waste:    { label: 'General Waste',    icon: '🗑️', color: '#6b7280', bg: 'bg-gray-50',   text: 'text-gray-700',   border: 'border-gray-200'  },
  resource_wastage: { label: 'Resource Wastage', icon: '💧', color: '#d97706', bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} style={style} />
}

// ── Custom bar tooltip ────────────────────────────────────────────────────────
function BarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { name, value, fill } = payload[0].payload
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-3 py-2 text-xs">
      <div className="font-semibold capitalize" style={{ color: fill }}>{name}</div>
      <div className="text-gray-600 mt-0.5">{value} tickets</div>
    </div>
  )
}

// ── Custom line tooltip ───────────────────────────────────────────────────────
function LineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-3 py-2 text-xs space-y-1 min-w-[120px]">
      <div className="font-semibold text-gray-600 border-b pb-1 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            <span className="capitalize">{p.dataKey}</span>
          </span>
          <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Stat summary card ─────────────────────────────────────────────────────────
function SummaryCard({ icon, value, label, sub, bg, border, text, iconBg, loading }:
  { icon: string; value: string | number; label: string; sub?: string; bg: string; border: string; text: string; iconBg: string; loading?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 card-hover ${bg} ${border}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${iconBg}`}>{icon}</div>
      <div className="min-w-0">
        {loading
          ? <Skeleton className="h-7 w-14 mb-1" />
          : <div className={`text-2xl font-extrabold leading-none ${text}`}>{value}</div>
        }
        <div className={`text-xs font-medium mt-1 ${text} opacity-70`}>{label}</div>
        {sub && <div className="text-[10px] text-gray-400 mt-0.5 truncate">{sub}</div>}
      </div>
    </div>
  )
}

// ── Chart card wrapper ────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children, loading, skeletonH = 220 }:
  { title: string; subtitle?: string; children: React.ReactNode; loading: boolean; skeletonH?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {loading ? <Skeleton className={`w-full`} style={{ height: skeletonH }} /> : children}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data,    setData]    = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getAnalytics()
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [])

  // ── Derived values ────────────────────────────────────────────────────────
  const catChartData = useMemo(() =>
    data
      ? Object.entries(data.tickets_by_category).map(([k, v]) => ({
          name: CAT_META[k]?.label ?? k.replace(/_/g, ' '),
          value: v,
          fill: CAT_META[k]?.color ?? '#94a3b8',
          icon: CAT_META[k]?.icon ?? '📦',
        }))
      : [],
    [data],
  )

  const totalTickets    = useMemo(() => catChartData.reduce((s, c) => s + c.value, 0), [catChartData])
  const topCat          = useMemo(() => catChartData.sort((a, b) => b.value - a.value)[0], [catChartData])
  const totalRaised     = useMemo(() => data?.weekly_trend.reduce((s, w) => s + w.raised, 0) ?? 0,   [data])
  const totalResolved   = useMemo(() => data?.weekly_trend.reduce((s, w) => s + w.resolved, 0) ?? 0, [data])
  const resolutionRate  = totalRaised > 0 ? Math.round((totalResolved / totalRaised) * 100) : 0
  const topZone         = data?.top_problem_zones[0]
  const maxZoneTickets  = data ? Math.max(...data.top_problem_zones.map(z => z.open_tickets), 1) : 1

  // Donut data for resolution rate
  const donutData = [
    { name: 'Resolved', value: totalResolved, fill: '#16a34a' },
    { name: 'Open',     value: Math.max(totalRaised - totalResolved, 0), fill: '#f3f4f6' },
  ]

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div
          className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 55%, #065f46 100%)' }}
        >
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-1">Admin</p>
            <h1 className="text-xl md:text-2xl font-extrabold text-white">📊 Analytics</h1>
            <p className="text-green-300/70 text-sm mt-0.5">Issue trends, category breakdown, and problem zones.</p>
          </div>
        </div>

        {/* ── Summary stat strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard
            icon="🎫" value={loading ? '…' : totalTickets} label="Total Tickets"
            bg="stat-purple" border="border-purple-100" text="text-purple-700" iconBg="bg-purple-500/15"
            loading={loading}
          />
          <SummaryCard
            icon="✅" value={loading ? '…' : `${resolutionRate}%`} label="Resolution Rate"
            sub={loading ? undefined : `${totalResolved} of ${totalRaised} resolved`}
            bg="stat-green" border="border-green-100" text="text-green-700" iconBg="bg-green-500/15"
            loading={loading}
          />
          <SummaryCard
            icon={loading ? '📦' : (topCat?.icon ?? '📦')}
            value={loading ? '…' : (topCat?.value ?? 0)}
            label="Top Category"
            sub={loading ? undefined : topCat?.name}
            bg="stat-amber" border="border-amber-100" text="text-amber-700" iconBg="bg-amber-500/15"
            loading={loading}
          />
          <SummaryCard
            icon="🔴" value={loading ? '…' : (topZone?.open_tickets ?? 0)} label="Worst Zone"
            sub={loading ? undefined : topZone?.department}
            bg="stat-blue" border="border-blue-100" text="text-blue-700" iconBg="bg-blue-500/15"
            loading={loading}
          />
        </div>

        {/* ── Charts row 1 ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Category breakdown bar chart */}
          <ChartCard title="Tickets by Category" subtitle="All time · colour per category" loading={loading} skeletonH={240}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={catChartData} barSize={28} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <ReTooltip content={<BarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {catChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Category legend */}
            <div className="flex flex-wrap gap-2 mt-3">
              {catChartData.map(c => {
                const meta = Object.values(CAT_META).find(m => m.color === c.fill)
                return (
                  <span key={c.name} className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${meta?.bg ?? 'bg-gray-50'} ${meta?.text ?? 'text-gray-600'} ${meta?.border ?? 'border-gray-200'}`}>
                    {c.icon} {c.name} · {c.value}
                  </span>
                )
              })}
            </div>
          </ChartCard>

          {/* Resolution rate donut */}
          <ChartCard title="Resolution Rate" subtitle={`${resolutionRate}% of raised tickets resolved`} loading={loading} skeletonH={240}>
            <div className="flex flex-col items-center gap-3">
              <div className="relative" style={{ width: 180, height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%" cy="50%"
                      innerRadius={58} outerRadius={82}
                      startAngle={90} endAngle={-270}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {donutData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Centre label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-green-700">{resolutionRate}%</span>
                  <span className="text-[10px] text-gray-400 font-medium">Resolved</span>
                </div>
              </div>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-green-600 inline-block" />
                  <span className="text-gray-600">Resolved <span className="font-bold text-gray-800">{totalResolved}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" />
                  <span className="text-gray-600">Open <span className="font-bold text-gray-800">{Math.max(totalRaised - totalResolved, 0)}</span></span>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* ── Weekly trend ── */}
        <ChartCard title="Weekly Trend" subtitle="Raised vs resolved over the past 12 weeks" loading={loading} skeletonH={260}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data?.weekly_trend ?? []} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <defs>
                <linearGradient id="raisedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f97316" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <ReTooltip content={<LineTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />
              <Line
                type="monotone" dataKey="raised"
                stroke="#f97316" strokeWidth={2.5}
                dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone" dataKey="resolved"
                stroke="#16a34a" strokeWidth={2.5}
                dot={{ r: 3, fill: '#16a34a', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ── Top problem zones ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-gray-800 text-sm">🔴 Top Problem Zones</h3>
            <p className="text-xs text-gray-400 mt-0.5">Departments with the most open tickets</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : data?.top_problem_zones.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-sm font-medium">No open problem zones!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data!.top_problem_zones.map((z, i) => {
                const pct    = Math.round((z.open_tickets / maxZoneTickets) * 100)
                const colors = [
                  { bar: '#dc2626', bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    num: 'bg-red-500'    },
                  { bar: '#f97316', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', num: 'bg-orange-400' },
                  { bar: '#f59e0b', bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  num: 'bg-amber-400'  },
                  { bar: '#6b7280', bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-700',   num: 'bg-gray-400'   },
                  { bar: '#6b7280', bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-700',   num: 'bg-gray-400'   },
                ]
                const c = colors[Math.min(i, colors.length - 1)]
                return (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${c.bg} ${c.border}`}>
                    {/* Rank badge */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0 ${c.num}`}>
                      {i + 1}
                    </div>
                    {/* Name + bar */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${c.text} truncate`}>{z.department}</div>
                      <div className="w-full bg-white rounded-full h-2 mt-1.5 overflow-hidden border border-white">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: c.bar }}
                        />
                      </div>
                    </div>
                    {/* Count */}
                    <div className={`text-sm font-extrabold flex-shrink-0 ${c.text}`}>
                      {z.open_tickets}
                      <span className="text-[10px] font-normal text-gray-400 ml-1">open</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}
