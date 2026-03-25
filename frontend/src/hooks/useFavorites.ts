import { useState, useCallback } from 'react'

const STORAGE_KEY = 'cocktail-favorites'

function loadFavorites(): Set<number> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? new Set(JSON.parse(stored) as number[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveFavorites(favs: Set<number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...favs]))
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<number>>(loadFavorites)

  const toggle = useCallback((id: number) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      saveFavorites(next)
      return next
    })
  }, [])

  const isFavorite = useCallback((id: number) => favorites.has(id), [favorites])

  return { favorites, toggle, isFavorite }
}
