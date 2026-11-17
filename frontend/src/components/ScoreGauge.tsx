import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { getLevel, LEVELS } from './Leaderboard'

interface Props {
  score: number
  label?: string
  size?: number
}

export default function ScoreGauge({ score, label = 'Eco Score', size = 170 }: Props) {
  const level    = getLevel(score)
  const nextLvl  = LEVELS.find(l => l.min > score)
  const pctToNext = nextLvl
    ? Math.round(((score - level.min) / (nextLvl.min - level.min)) * 100)
    : 100

  // Arc colour derived from level
  const arcColor = level.barColor

  return (
    <div className="flex flex-col items-center w-full">
      {/* Radial chart */}
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="62%" outerRadius="92%"
            startAngle={90} endAngle={-270}
            data={[{ value: score, fill: arcColor }]}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#f3f4f6' }} />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Centre overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl leading-none mb-0.5">{level.icon}</span>
          <span className="text-2xl font-extrabold leading-none" style={{ color: arcColor }}>{score}</span>
          <span className="text-[10px] font-semibold text-gray-400 mt-0.5">{label}</span>
        </div>
      </div>

      {/* Level badge */}
      <div className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${level.bg} ${level.color} ${level.border}`}>
        {level.icon} {level.name}
      </div>

      {/* Next level progress */}
      {nextLvl && (
        <div className="w-full mt-3 space-y-1 px-1">
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>Progress to <span className="font-semibold">{nextLvl.icon} {nextLvl.name}</span></span>
            <span>{pctToNext}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pctToNext}%`, backgroundColor: arcColor }}
            />
          </div>
          <p className="text-[10px] text-gray-400 text-center">{nextLvl.min - score} pts to unlock</p>
        </div>
      )}
      {!nextLvl && (
        <p className="text-[11px] font-semibold text-purple-600 mt-2">⚡ Max level reached!</p>
      )}
    </div>
  )
}
