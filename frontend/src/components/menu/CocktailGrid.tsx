import { motion, AnimatePresence } from 'framer-motion'
import type { CocktailListItem } from '../../types'
import CocktailCard from './CocktailCard'

interface CocktailGridProps {
  cocktails: CocktailListItem[]
  loading?: boolean
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: 'easeOut',
    },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
}

export default function CocktailGrid({ cocktails, loading }: CocktailGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="card animate-pulse"
          >
            <div className="h-36 bg-bar-border" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-bar-border rounded w-3/4" />
              <div className="h-3 bg-bar-border rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (cocktails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <span className="text-5xl mb-4">🍹</span>
        <p className="text-gray-400 text-lg">No cocktails found</p>
        <p className="text-gray-600 text-sm mt-1">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <AnimatePresence mode="popLayout">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {cocktails.map((cocktail, i) => (
          <motion.div
            key={cocktail.id}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
          >
            <CocktailCard cocktail={cocktail} />
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  )
}
