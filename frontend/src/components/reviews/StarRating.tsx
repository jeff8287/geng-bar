interface StarRatingProps {
  value: number
  onChange?: (rating: number) => void
  readOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
}

export default function StarRating({ value, onChange, readOnly = false, size = 'md' }: StarRatingProps) {
  const sizeClass = SIZE_CLASSES[size]

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={`${sizeClass} transition-colors leading-none ${
            readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'
          } ${star <= value ? 'text-bar-gold' : 'text-gray-600'}`}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
