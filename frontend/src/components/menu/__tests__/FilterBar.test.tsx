import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import FilterBar from '../FilterBar'

describe('FilterBar', () => {
  it('renders all category buttons', () => {
    render(<FilterBar filters={{}} onChange={() => {}} />)
    expect(screen.getByText('all')).toBeInTheDocument()
    expect(screen.getByText('refreshing')).toBeInTheDocument()
    expect(screen.getByText('sweet')).toBeInTheDocument()
    expect(screen.getByText('tropical')).toBeInTheDocument()
  })

  it('calls onChange with category when chip clicked', async () => {
    const onChange = vi.fn()
    render(<FilterBar filters={{}} onChange={onChange} />)
    await userEvent.click(screen.getByText('tropical'))
    expect(onChange).toHaveBeenCalledWith({ category: 'tropical' })
  })

  it('calls onChange with undefined category when "all" clicked', async () => {
    const onChange = vi.fn()
    render(<FilterBar filters={{ category: 'sweet' }} onChange={onChange} />)
    await userEvent.click(screen.getByText('all'))
    expect(onChange).toHaveBeenCalledWith({ category: undefined })
  })

  it('toggles available_only filter', async () => {
    const onChange = vi.fn()
    render(<FilterBar filters={{}} onChange={onChange} />)
    await userEvent.click(screen.getByText('Available only'))
    expect(onChange).toHaveBeenCalledWith({ available_only: true })
  })

  it('renders search input with current value', () => {
    render(<FilterBar filters={{ search: 'mojito' }} onChange={() => {}} />)
    expect(screen.getByPlaceholderText('Search cocktails...')).toHaveValue('mojito')
  })
})
