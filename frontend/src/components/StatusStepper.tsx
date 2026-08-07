import type { TicketStatus } from '../types'

interface Props { status: TicketStatus }

const STEPS: TicketStatus[] = ['raised', 'in_progress', 'resolved']
const LABELS = ['Raised', 'In Progress', 'Resolved']

export default function StatusStepper({ status }: Props) {
  const current = STEPS.indexOf(status)
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className={`flex flex-col items-center`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2
              ${i <= current ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-xs mt-1 ${i <= current ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
              {LABELS[i]}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-12 h-0.5 mb-4 ${i < current ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}
