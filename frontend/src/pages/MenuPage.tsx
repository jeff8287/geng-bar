import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Header from '../components/layout/Header'
import MobileNav from '../components/layout/MobileNav'
import FilterBar from '../components/menu/FilterBar'
import CocktailGrid from '../components/menu/CocktailGrid'
import { getMenu } from '../api/cocktails'
import type { CocktailListItem, MenuFilters } from '../types'

const REFRESH_INTERVAL = 30_000

export default function MenuPage() {
  const [cocktails, setCocktails] = useState<CocktailListItem[]>([])
  const [filters, setFilters] = useState<MenuFilters>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  const fetchMenu = useCallback(async () => {
    try {
      const data = await getMenu(filters)
      setCocktails(data)
      setError('')
    } catch {
      setError('Could not load menu. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    setLoading(true)
    fetchMenu()
  }, [fetchMenu])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(Date.now())
      fetchMenu()
    }, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchMenu])

  function handleRefresh() {
    setLoading(true)
    setLastRefresh(Date.now())
    fetchMenu()
  }

  return (
    <div className="min-h-screen bg-bar-bg flex flex-col">
      <Header />
      <FilterBar filters={filters} onChange={setFilters} />

      <main className="flex-1 pb-20">
        {/* Refresh indicator */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <motion.p
            key={lastRefresh}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-600 text-xs"
          >
            {cocktails.length} cocktail{cocktails.length !== 1 ? 's' : ''}
          </motion.p>
          <button
            onClick={handleRefresh}
            className="text-gray-500 hover:text-bar-gold transition-colors text-xs"
          >
            ↻ Refresh
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-2 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <CocktailGrid cocktails={cocktails} loading={loading} />
      </main>

      <MobileNav />
    </div>
  )
}
