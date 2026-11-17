import type { TicketCategory, TicketStatus } from '../types'

const CATEGORY_COLORS: Record<TicketCategory, string> = {
  organic: 'bg-green-100 text-green-800',
  recyclable: 'bg-blue-100 text-blue-800',
  hazardous: 'bg-red-100 text-red-800',
  general_waste: 'bg-gray-100 text-gray-800',
  resource_wastage: 'bg-yellow-100 text-yellow-800',
}

const CATEGORY_ICONS: Record<TicketCategory, string> = {
  organic: '🌿',
  recyclable: '♻️',
  hazardous: '⚠️',
  general_waste: '🗑️',
  resource_wastage: '💧',
}

const STATUS_COLORS: Record<TicketStatus, string> = {
  raised: 'bg-orange-100 text-orange-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
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
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {ticket.image_url ? (
          <img
            src={`${import.meta.env.VITE_API_URL || ''}${ticket.image_url}`}
            alt="ticket"
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
            {CATEGORY_ICONS[ticket.category]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[ticket.category]}`}>
              {CATEGORY_ICONS[ticket.category]} {ticket.category.replace('_', ' ')}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[ticket.status]}`}>
              {ticket.status.replace('_', ' ')}
            </span>
            {ticket.ai_confidence && (
              <span className="text-xs text-gray-400">AI {Math.round(ticket.ai_confidence * 100)}%</span>
            )}
          </div>
          <p className="text-sm text-gray-700 mt-1 line-clamp-2">{ticket.action_recommendation}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            {ticket.department && <span>📍 {ticket.department.name}</span>}
            <span>🕐 {new Date(ticket.created_at).toLocaleDateString()}</span>
            <span>#{ticket.id}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
