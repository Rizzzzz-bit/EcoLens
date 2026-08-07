import type { UserBadge } from '../types'

interface Props {
  badges: UserBadge[]
}

export default function BadgeShelf({ badges }: Props) {
  if (!badges.length) return (
    <p className="text-sm text-gray-400 italic">No badges yet — keep reporting!</p>
  )
  return (
    <div className="flex flex-wrap gap-3">
      {badges.map((ub) => (
        <div key={ub.badge.id} className="flex flex-col items-center group" title={ub.badge.description}>
          <div className="text-3xl">{ub.badge.icon}</div>
          <div className="text-xs text-gray-600 font-medium mt-1 max-w-[64px] text-center leading-tight">
            {ub.badge.name}
          </div>
          <div className="hidden group-hover:block absolute mt-12 bg-gray-800 text-white text-xs rounded px-2 py-1 z-10 whitespace-nowrap">
            {ub.badge.description}
          </div>
        </div>
      ))}
    </div>
  )
}
