import type { TicketCategory, TicketStatus } from '../types'

const CATEGORY_CONFIG: Record<TicketCategory, { label: string; icon: string; bg: string; text: string; border: string; accent: string }> = {
  organic:          { label: 'Organic',          icon: '🌿', bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200', accent: '#16a34a' },
  recyclable:       { label: 'Recyclable',       icon: '♻️', bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',  accent: '#2563eb' },
  hazardous:        { label: 'Hazardous',        icon: '⚠️', bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',   accent: '#dc2626' },
  general_waste:    { label: 'General Waste',    icon: '🗑️', bg: 'bg-gray-50',   text: 'text-gray-700',   border: 'border-gray-200',  accent: '#6b7280' },
  resource_wastage: { label: 'Resource Wastage', icon: '💧', bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200', accent: '#d97706' },
}

const STATUS_CONFIG: Record<TicketStatus, { label: string; bg: string; text: string; dot: string }> = {
  raised:      { label: 'Raised',      bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-400'   },
  resolved:    { label: 'Resolved',    bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
}

interface Props {
  ticket: {
    id: number
    category: TicketCategory
    status: TicketStatus
    action_recommendation: string
    lat: number
    lng: number
    created_at: string
    ai_confidence?: number | null
    department?: { name: string }
    image_url?: string | null
  }
  onClick?: () => void
}

export default function TicketCard({ ticket, onClick }: Props) {
  const cat = CATEGORY_CONFIG[ticket.category]
  const st = STATUS_CONFIG[ticket.status]
  const timeAgo = (() => {
    // Backend returns UTC without 'Z'; append it so browsers parse as UTC not local time
    const raw = ticket.created_at.endsWith('Z') ? ticket.created_at : ticket.created_at + 'Z'
    const diff = (Date.now() - new Date(raw).getTime()) / 1000
    if (diff < 60)   return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  })()

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-2xl border overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${cat.border}`}
      style={{ borderLeftWidth: 3, borderLeftColor: cat.accent }}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Thumbnail / icon */}
        {ticket.image_url ? (
          <img
            src={`${import.meta.env.VITE_API_URL || ''}${ticket.image_url}`}
            alt="ticket"
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0 ring-1 ring-black/5"
          />
        ) : (
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${cat.bg}`}>
            {cat.icon}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>
              {cat.icon} {cat.label}
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot} pulse-dot`} />
              {st.label}
            </span>
            {ticket.ai_confidence && (
              <span className="text-[10px] text-gray-400 font-medium">
                AI {Math.round(ticket.ai_confidence * 100)}%
              </span>
            )}
          </div>

          {/* Action recommendation */}
          <p className="text-sm text-gray-700 leading-snug line-clamp-2">{ticket.action_recommendation}</p>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
            {ticket.department && (
              <span className="flex items-center gap-0.5">
                <span>📍</span> {ticket.department.name}
              </span>
            )}
            <span>{timeAgo}</span>
            <span className="ml-auto font-mono text-gray-300">#{ticket.id}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
