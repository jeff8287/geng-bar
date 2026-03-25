import type { Review } from '../../types'
import StarRating from './StarRating'

interface ReviewListProps {
  reviews: Review[]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ReviewList({ reviews }: ReviewListProps) {
  const sorted = [...reviews].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">No reviews yet. Be the first!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sorted.map((review) => (
        <div key={review.id} className="card p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-medium text-white text-sm">{review.nickname}</p>
              <StarRating value={review.rating} readOnly size="sm" />
            </div>
            <span className="text-gray-600 text-xs">{formatDate(review.created_at)}</span>
          </div>
          {review.comment && (
            <p className="text-gray-300 text-sm mt-2 leading-relaxed">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  )
}
