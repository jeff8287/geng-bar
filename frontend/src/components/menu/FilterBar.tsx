import { useTranslation } from 'react-i18next'
import type { MenuFilters } from '../../types'

const CATEGORIES = ['all', 'refreshing', 'sweet', 'complex', 'tropical', 'seasonal', 'classic']

interface FilterBarProps {
  filters: MenuFilters
  onChange: (filters: MenuFilters) => void
}

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const { t } = useTranslation()
  const currentCategory = filters.category ?? 'all'

  function setCategory(cat: string) {
    onChange({ ...filters, category: cat === 'all' ? undefined : cat })
  }

  function setSearch(search: string) {
    onChange({ ...filters, search: search || undefined })
  }

  function toggleAvailableOnly() {
    onChange({ ...filters, available_only: !filters.available_only })
  }

  function toggleFavoritesOnly() {
    onChange({ ...filters, favorites_only: !filters.favorites_only })
  }

  return (
    <div className="bg-bar-bg border-b border-bar-border">
      {/* Category chips */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              currentCategory === cat
                ? 'bg-bar-gold text-bar-bg'
                : 'bg-bar-card text-gray-400 hover:text-white border border-bar-border'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search + toggle row */}
      <div className="flex items-center gap-3 px-4 pb-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          <input
            type="text"
            value={filters.search ?? ''}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('menu.searchPlaceholder')}
            className="input-field pl-9 py-2 text-sm"
          />
        </div>
        <button
          onClick={toggleFavoritesOnly}
          className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
            filters.favorites_only
              ? 'bg-red-900/40 border-red-600 text-red-400'
              : 'bg-bar-card border-bar-border text-gray-400 hover:text-white'
          }`}
        >
          ♥ {t('menu.favorites')}
        </button>
        <button
          onClick={toggleAvailableOnly}
          className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
            filters.available_only
              ? 'bg-emerald-900/40 border-emerald-600 text-emerald-400'
              : 'bg-bar-card border-bar-border text-gray-400 hover:text-white'
          }`}
        >
          {t('menu.availableOnly')}
        </button>
      </div>
    </div>
  )
}
