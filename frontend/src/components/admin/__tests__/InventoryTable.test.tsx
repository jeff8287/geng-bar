import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi } from 'vitest'
import InventoryTable from '../InventoryTable'
import type { Ingredient } from '../../../types'

vi.mock('../../../hooks/useIngredients', () => ({
  useUpdateIngredientStatus: () => ({
    mutate: vi.fn(),
    isPending: false,
    variables: null,
  }),
}))

const mockIngredients: Ingredient[] = [
  { id: 1, name: 'Gin', category: 'Spirits', status: 'in_stock', created_at: '', updated_at: '' },
  { id: 2, name: 'Lime Juice', category: 'Juices', subcategory: 'Citrus', status: 'low', created_at: '', updated_at: '' },
  { id: 3, name: 'Angostura', category: 'Bitters', status: 'out_of_stock', created_at: '', updated_at: '' },
]

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('InventoryTable', () => {
  it('renders all ingredient names', () => {
    renderWithQuery(<InventoryTable ingredients={mockIngredients} />)
    expect(screen.getByText('Gin')).toBeInTheDocument()
    expect(screen.getByText('Lime Juice')).toBeInTheDocument()
    expect(screen.getByText('Angostura')).toBeInTheDocument()
  })

  it('shows correct status badges', () => {
    renderWithQuery(<InventoryTable ingredients={mockIngredients} />)
    expect(screen.getByText('In Stock')).toBeInTheDocument()
    expect(screen.getByText('Low')).toBeInTheDocument()
    expect(screen.getByText('Out of Stock')).toBeInTheDocument()
  })

  it('shows empty state when no ingredients', () => {
    renderWithQuery(<InventoryTable ingredients={[]} />)
    expect(screen.getByText('No ingredients found.')).toBeInTheDocument()
  })

  it('filters by category', () => {
    renderWithQuery(<InventoryTable ingredients={mockIngredients} filterCategory="Spirits" />)
    expect(screen.getByText('Gin')).toBeInTheDocument()
    expect(screen.queryByText('Lime Juice')).not.toBeInTheDocument()
  })
})
