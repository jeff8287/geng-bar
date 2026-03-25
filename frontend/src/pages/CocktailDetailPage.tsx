import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../components/layout/Header'
import MobileNav from '../components/layout/MobileNav'
import FlavorChart from '../components/menu/FlavorChart'
import StarRating from '../components/reviews/StarRating'
import ReviewList from '../components/reviews/ReviewList'
import ReviewForm from '../components/reviews/ReviewForm'
import { useCocktailDetail } from '../hooks/useCocktailDetail'
import { useReviews } from '../hooks/useReviews'
import { useIngredients } from '../hooks/useIngredients'
import { useAuth } from '../contexts/AuthContext'
import AvailabilityBadge from '../components/menu/AvailabilityBadge'

function parseSteps(instructions: string): string[] {
  const byNewline = instructions.split(/\n+/).map(s => s.trim()).filter(Boolean)
  if (byNewline.length > 1) return byNewline
  const byNumber = instructions.split(/(?=\d+\.\s)/).map(s => s.trim()).filter(Boolean)
  if (byNumber.length > 1) return byNumber
  return byNewline
}

export default function CocktailDetailPage() {
  const { id } = useParams<{ id: string }>()
  const numId = id ? Number(id) : undefined
  const { isAdmin } = useAuth()
  const { data: cocktail, isLoading: loading, error: cocktailError } = useCocktailDetail(numId)
  const { data: reviews = [] } = useReviews(numId)
  const { data: allIngredients = [] } = useIngredients({ refetchInterval: 30_000, enabled: isAdmin })
  const error = cocktailError ? 'Could not load cocktail details.' : ''

  const ingredientStockMap = new Map(allIngredients.map(i => [i.id, i.status]))

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
              <img src={cocktail.image_url} alt={cocktail.name} loading="lazy" className="w-full h-full object-cover" />
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
                {cocktail.ingredients.map((ing) => {
                  const stock = ingredientStockMap.get(ing.ingredient_id)
                  return (
                    <div
                      key={`${ing.ingredient_id}`}
                      className="flex items-center justify-between py-2 border-b border-bar-border last:border-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-white text-sm">
                          {ing.ingredient_name ?? `Ingredient #${ing.ingredient_id}`}
                          {ing.is_optional && (
                            <span className="text-gray-600 text-xs ml-1">(optional)</span>
                          )}
                        </span>
                        {stock && <AvailabilityBadge available={stock !== 'out_of_stock'} size="sm" label={stock === 'low' ? 'Low' : undefined} />}
                      </div>
                      {ing.amount && (
                        <span className="text-gray-400 text-sm shrink-0">
                          {ing.amount} {ing.unit}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Instructions */}
            {cocktail.instructions && (
              <section className="mb-6">
                <h2 className="text-bar-gold font-semibold text-sm uppercase tracking-wider mb-3">Instructions</h2>
                <div className="card p-4">
                  <ol className="space-y-3">
                    {parseSteps(cocktail.instructions).map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-bar-gold font-bold text-sm shrink-0 w-6 h-6 rounded-full bg-bar-gold/10 flex items-center justify-center">
                          {i + 1}
                        </span>
                        <p className="text-gray-300 text-sm leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</p>
                      </li>
                    ))}
                  </ol>
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
              <ReviewForm cocktailId={cocktail.id} />
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
