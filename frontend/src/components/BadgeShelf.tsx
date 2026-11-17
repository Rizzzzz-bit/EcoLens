import type { UserBadge } from '../types'

interface Props {
  badges: UserBadge[]
  max?: number
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 86400) return 'Today'
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`
  if (diff < 86400 * 30) return `${Math.floor(diff / (86400 * 7))}w ago`
  return `${Math.floor(diff / (86400 * 30))}mo ago`
}

export default function BadgeShelf({ badges, max }: Props) {
  const shown = max ? badges.slice(0, max) : badges
  const remaining = max && badges.length > max ? badges.length - max : 0

  if (!badges.length) {
    return (
      <div className="flex flex-col items-center py-4 gap-2 text-center">
        <span className="text-3xl">🏅</span>
        <p className="text-sm text-gray-400">No badges yet</p>
        <p className="text-xs text-gray-300">Keep reporting to earn your first!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {shown.map(ub => (
        <div
          key={ub.badge.id}
          className="group relative flex flex-col items-center gap-1 p-2.5 rounded-xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all cursor-default min-w-[60px]"
        >
          <span className="text-2xl">{ub.badge.icon}</span>
          <span className="text-[10px] font-semibold text-gray-700 text-center leading-tight max-w-[56px]">
            {ub.badge.name}
          </span>
          <span className="text-[9px] text-gray-400">{timeAgo(ub.awarded_at)}</span>

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
            <div className="bg-gray-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 whitespace-nowrap max-w-[180px] text-center leading-snug shadow-lg">
              <div className="font-semibold mb-0.5">{ub.badge.name}</div>
              <div className="text-gray-300">{ub.badge.description}</div>
            </div>
            <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
          </div>
        </div>
      ))}

      {remaining > 0 && (
        <div className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl bg-gray-50 border border-gray-100 min-w-[60px]">
          <span className="text-sm font-bold text-gray-500">+{remaining}</span>
          <span className="text-[10px] text-gray-400">more</span>
        </div>
      )}
    </div>
  )
}
