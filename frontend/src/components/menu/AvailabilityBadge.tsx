interface AvailabilityBadgeProps {
  available: boolean
  size?: 'sm' | 'md'
}

export default function AvailabilityBadge({ available, size = 'sm' }: AvailabilityBadgeProps) {
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${textSize} font-medium ${
        available ? 'text-emerald-400' : 'text-red-400'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          available ? 'bg-emerald-400' : 'bg-red-400'
        }`}
      />
      {available ? 'Available' : 'Out of stock'}
    </span>
  )
}
