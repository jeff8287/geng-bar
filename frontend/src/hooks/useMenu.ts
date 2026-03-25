import { useQuery } from '@tanstack/react-query'
import { getMenu } from '../api/cocktails'
import type { MenuFilters } from '../types'

export function useMenu(filters?: MenuFilters) {
  return useQuery({
    queryKey: ['menu', filters],
    queryFn: () => getMenu(filters),
    refetchInterval: 30_000,
  })
}
