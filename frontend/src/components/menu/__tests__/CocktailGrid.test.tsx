import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import CocktailGrid from '../CocktailGrid'
import { FavoritesProvider } from '../../../contexts/FavoritesContext'
import type { CocktailListItem } from '../../../types'

const mockCocktails: CocktailListItem[] = [
  { id: 1, name: 'Mojito', is_available: true, category: 'refreshing' },
  { id: 2, name: 'Old Fashioned', is_available: false, category: 'classic' },
]

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter><FavoritesProvider>{ui}</FavoritesProvider></MemoryRouter>)
}

describe('CocktailGrid', () => {
  it('shows skeleton placeholders when loading', () => {
    const { container } = renderWithRouter(<CocktailGrid cocktails={[]} loading />)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBe(6)
  })

  it('shows empty state when no cocktails', () => {
    renderWithRouter(<CocktailGrid cocktails={[]} />)
    expect(screen.getByText('No cocktails found')).toBeInTheDocument()
  })

  it('renders cocktail cards when data provided', () => {
    renderWithRouter(<CocktailGrid cocktails={mockCocktails} />)
    expect(screen.getByText('Mojito')).toBeInTheDocument()
    expect(screen.getByText('Old Fashioned')).toBeInTheDocument()
  })
})
