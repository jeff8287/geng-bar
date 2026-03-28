import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { CocktailListItem } from '../../types'
import AvailabilityBadge from './AvailabilityBadge'
import { getCocktailImageUrl } from '../../utils/cocktailImage'

const CATEGORY_GRADIENTS: Record<string, string> = {
  refreshing: 'from-cyan-900 to-blue-900',
  sweet: 'from-pink-900 to-rose-900',
  complex: 'from-purple-900 to-indigo-900',
  tropical: 'from-orange-900 to-amber-900',
  seasonal: 'from-green-900 to-teal-900',
  shots: 'from-red-900 to-orange-900',
}

function StarDisplay({ rating }: { rating?: number }) {
  if (!rating) return null
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-xs ${star <= Math.round(rating) ? 'text-bar-gold' : 'text-gray-600'}`}
          >
            ★
          </span>
        ))}
      </div>
      <span className="text-gray-500 text-xs">{rating.toFixed(1)}</span>
    </div>
  )
}

interface CocktailCardProps {
  cocktail: CocktailListItem
}

export default function CocktailCard({ cocktail }: CocktailCardProps) {
  const navigate = useNavigate()
  const gradient = CATEGORY_GRADIENTS[cocktail.category ?? ''] ?? 'from-gray-800 to-gray-900'
  const imageUrl = getCocktailImageUrl(cocktail)

  return (
    <motion.div
      layoutId={`cocktail-${cocktail.id}`}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={() => navigate(`/menu/${cocktail.id}`)}
      className="card cursor-pointer hover:border-bar-gold/40 transition-colors"
    >
      {/* Image or gradient placeholder */}
      <div className={`h-36 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={cocktail.name}
            className="w-full h-full object-contain p-4 pixel-art"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-30">🍸</span>
          </div>
        )}
        {/* Category badge */}
        {cocktail.category && (
          <div className="absolute top-2 left-2">
            <span className="badge bg-black/50 text-gray-300 capitalize">
              {cocktail.category}
            </span>
          </div>
        )}
        {/* Unavailable overlay */}
        {!cocktail.is_available && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-red-400 font-semibold text-sm">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-white text-base mb-1 truncate">{cocktail.name}</h3>
        <div className="flex items-center justify-between">
          <StarDisplay rating={cocktail.avg_rating} />
          <AvailabilityBadge available={cocktail.is_available} size="sm" />
        </div>
      </div>
    </motion.div>
  )
}
