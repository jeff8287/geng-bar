import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { FlavorProfile } from '../../types'

interface FlavorChartProps {
  profile: FlavorProfile
}

const DIMENSION_LABELS: Record<keyof FlavorProfile, string> = {
  sweet: 'Sweet',
  sour: 'Sour',
  bitter: 'Bitter',
  boozy: 'Boozy',
  fruity: 'Fruity',
}

export default function FlavorChart({ profile }: FlavorChartProps) {
  const data = (Object.keys(DIMENSION_LABELS) as Array<keyof FlavorProfile>).map((key) => ({
    subject: DIMENSION_LABELS[key],
    value: profile[key],
    fullMark: 10,
  }))

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 10, right: 24, bottom: 10, left: 24 }}>
          <PolarGrid stroke="#2a2a4a" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <Radar
            name="Flavor"
            dataKey="value"
            stroke="#d4a76a"
            fill="#d4a76a"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #2a2a4a',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px',
            }}
            formatter={(value: number) => [value, 'Intensity']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
