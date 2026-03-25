import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../components/layout/Header'
import MobileNav from '../components/layout/MobileNav'
import FlavorChart from '../components/menu/FlavorChart'
import StarRating from '../components/reviews/StarRating'
import ReviewList from '../components/reviews/ReviewList'
import ReviewForm from '../components/reviews/ReviewForm'
import { getCocktailDetail } from '../api/cocktails'
import { getReviews } from '../api/reviews'
import type { CocktailDetail, Review } from '../types'

export default function CocktailDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [cocktail, setCocktail] = useState<CocktailDetail | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDetail = useCallback(async () => {
    if (!id) return
    try {
      const data = await getCocktailDetail(Number(id))
      setCocktail(data)
      const reviewData = await getReviews(Number(id))
      setReviews(reviewData)
      setError('')
    } catch {
      setError('Could not load cocktail details.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  if (loading) {
    return (
      <div className="min-h-screen bg-bar-bg flex flex-col">
        <Header showBack title="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-bar-gold text-4xl animate-pulse">🍸</div>
        </div>
        <MobileNav />
      </div>
    )
  }

  if (error || !cocktail) {
    return (
      <div className="min-h-screen bg-bar-bg flex flex-col">
        <Header showBack title="Error" />
        <div className="flex-1 flex items-center justify-center px-6">
          <p className="text-red-400">{error || 'Cocktail not found.'}</p>
        </div>
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bar-bg flex flex-col">
      <Header showBack title={cocktail.name} />

      <main className="flex-1 pb-24 max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Hero */}
          <div className="relative h-52 sm:h-64 bg-gradient-to-br from-bar-card to-bar-bg overflow-hidden">
            {cocktail.image_url ? (
              <img src={cocktail.image_url} alt={cocktail.name} className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-8xl opacity-20">🍸</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bar-bg via-transparent to-transparent" />
          </div>

          <div className="px-4 -mt-6 relative z-10">
            {/* Title */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-white mb-2">{cocktail.name}</h1>
              <div className="flex items-center flex-wrap gap-2 mb-2">
                {cocktail.category && (
                  <span className="badge bg-bar-card border border-bar-border text-gray-400 capitalize">
                    {cocktail.category}
                  </span>
                )}
                {cocktail.glass_type && (
                  <span className="badge bg-bar-card border border-bar-border text-gray-500">
                    🥃 {cocktail.glass_type}
                  </span>
                )}
                {cocktail.difficulty && (
                  <span className="badge bg-bar-card border border-bar-border text-gray-500">
                    {cocktail.difficulty}
                  </span>
                )}
              </div>
              {cocktail.avg_rating && (
                <div className="flex items-center gap-2">
                  <StarRating value={Math.round(cocktail.avg_rating)} readOnly size="sm" />
                  <span className="text-gray-400 text-xs">{cocktail.avg_rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {cocktail.description && (
              <p className="text-gray-300 text-sm leading-relaxed mb-6">{cocktail.description}</p>
            )}

            {/* Ingredients */}
            <section className="mb-6">
              <h2 className="text-bar-gold font-semibold text-sm uppercase tracking-wider mb-3">
                Ingredients ({cocktail.ingredients.length})
              </h2>
              <div className="space-y-2">
                {cocktail.ingredients.map((ing) => (
                  <div
                    key={`${ing.ingredient_id}`}
                    className="flex items-center justify-between py-2 border-b border-bar-border last:border-0"
                  >
                    <span className="text-white text-sm">
                      {ing.ingredient_name ?? `Ingredient #${ing.ingredient_id}`}
                      {ing.is_optional && (
                        <span className="text-gray-600 text-xs ml-1">(optional)</span>
                      )}
                    </span>
                    {ing.amount && (
                      <span className="text-gray-400 text-sm shrink-0">
                        {ing.amount} {ing.unit}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Instructions */}
            {cocktail.instructions && (
              <section className="mb-6">
                <h2 className="text-bar-gold font-semibold text-sm uppercase tracking-wider mb-3">Instructions</h2>
                <div className="card p-4">
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {cocktail.instructions}
                  </p>
                </div>
              </section>
            )}

            {/* Flavor Profile */}
            {cocktail.flavor_profile && (
              <section className="mb-6">
                <h2 className="text-bar-gold font-semibold text-sm uppercase tracking-wider mb-3">Flavor Profile</h2>
                <div className="card p-4">
                  <FlavorChart profile={cocktail.flavor_profile} />
                </div>
              </section>
            )}

            {/* Garnish */}
            {cocktail.garnish && (
              <section className="mb-6">
                <div className="card p-3 text-center">
                  <p className="text-gray-500 text-xs mb-1">Garnish</p>
                  <p className="text-white text-sm font-medium">{cocktail.garnish}</p>
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="mb-6">
              <h2 className="text-bar-gold font-semibold text-sm uppercase tracking-wider mb-3">Reviews</h2>
              <ReviewForm cocktailId={cocktail.id} onReviewAdded={fetchDetail} />
              <div className="mt-4">
                <ReviewList reviews={reviews} />
              </div>
            </section>
          </div>
        </motion.div>
      </main>

      <MobileNav />
    </div>
  )
}
