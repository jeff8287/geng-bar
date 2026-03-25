interface AvailabilityBadgeProps {
  available: boolean
  size?: 'sm' | 'md'
  label?: string
}

export default function AvailabilityBadge({ available, size = 'sm', label }: AvailabilityBadgeProps) {
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
  const isLow = label === 'Low'
  const colorClass = isLow ? 'text-amber-400' : available ? 'text-emerald-400' : 'text-red-400'
  const dotClass = isLow ? 'bg-amber-400' : available ? 'bg-emerald-400' : 'bg-red-400'
  const displayLabel = label ?? (available ? 'Available' : 'Out of stock')

  return (
    <span className={`inline-flex items-center gap-1.5 ${textSize} font-medium ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {displayLabel}
    </span>
  )
}
