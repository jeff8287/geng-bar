import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../components/layout/Header'
import MobileNav from '../components/layout/MobileNav'
import FilterBar from '../components/menu/FilterBar'
import CocktailGrid from '../components/menu/CocktailGrid'
import { useMenu } from '../hooks/useMenu'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '../hooks/useDebounce'
import { useFavoritesContext } from '../contexts/FavoritesContext'
import type { MenuFilters } from '../types'

function paramsToFilters(params: URLSearchParams): MenuFilters {
  return {
    category: params.get('category') || undefined,
    search: params.get('search') || undefined,
    available_only: params.get('available_only') === 'true' || undefined,
    favorites_only: params.get('favorites_only') === 'true' || undefined,
  }
}

function filtersToParams(filters: MenuFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.category) params.set('category', filters.category)
  if (filters.search) params.set('search', filters.search)
  if (filters.available_only) params.set('available_only', 'true')
  if (filters.favorites_only) params.set('favorites_only', 'true')
  return params
}

export default function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = paramsToFilters(searchParams)
  const { favorites_only, ...apiFilters } = filters
  const debouncedApiFilters = useDebounce(apiFilters, 300)
  const { data: cocktails = [], isLoading: loading, error, dataUpdatedAt, refetch } = useMenu(debouncedApiFilters)
  const { isFavorite } = useFavoritesContext()
  const { t } = useTranslation()

  const displayedCocktails = favorites_only
    ? cocktails.filter(c => isFavorite(c.id))
    : cocktails

  const setFilters = useCallback((newFilters: MenuFilters) => {
    setSearchParams(filtersToParams(newFilters), { replace: true })
  }, [setSearchParams])

  function handleRefresh() {
    refetch()
  }

  return (
    <div className="min-h-screen bg-bar-bg flex flex-col">
      <Header />
      <FilterBar filters={filters} onChange={setFilters} />

      <main className="flex-1 pb-20">
        {/* Refresh indicator */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <motion.p
            key={dataUpdatedAt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-600 text-xs"
          >
            {displayedCocktails.length} cocktail{displayedCocktails.length !== 1 ? 's' : ''}
          </motion.p>
          <button
            onClick={handleRefresh}
            className="text-gray-500 hover:text-bar-gold transition-colors text-xs"
          >
            ↻ {t('menu.refresh')}
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-2 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
            {t('menu.errorLoad')}
          </div>
        )}

        <CocktailGrid cocktails={displayedCocktails} loading={loading} />
      </main>

      <MobileNav />
    </div>
  )
}
