import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useCreateReview } from '../../hooks/useReviews'
import StarRating from './StarRating'

interface ReviewFormProps {
  cocktailId: number
}

export default function ReviewForm({ cocktailId }: ReviewFormProps) {
  const { user } = useAuth()
  const createReview = useCreateReview(cocktailId)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const nickname = user?.nickname ?? user?.username ?? 'Guest'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a rating.')
      return
    }
    setError('')
    try {
      await createReview.mutateAsync({
        rating,
        comment: comment.trim() || undefined,
      })
      setSubmitted(true)
    } catch {
      setError('Could not submit review. Please try again.')
    }
  }

  if (submitted) {
    return (
      <div className="card p-4 text-center">
        <span className="text-2xl mb-2 block">🎉</span>
        <p className="text-emerald-400 font-medium">Thanks for your review!</p>
      </div>
    )
  }

  return (
    <div className="card p-4">
      <h3 className="font-semibold text-white mb-3">Leave a Review</h3>
      <p className="text-gray-400 text-xs mb-3">
        Reviewing as <span className="text-bar-gold">{nickname}</span>
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Rating</label>
          <StarRating value={rating} onChange={setRating} size="lg" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Comment (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you think?"
            rows={3}
            maxLength={500}
            className="input-field resize-none text-sm"
          />
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button
          type="submit"
          disabled={createReview.isPending || rating === 0}
          className="w-full btn-gold py-2.5 text-sm"
        >
          {createReview.isPending ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  )
}
