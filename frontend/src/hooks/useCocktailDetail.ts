import { useQuery } from '@tanstack/react-query'
import { getCocktailDetail } from '../api/cocktails'

export function useCocktailDetail(id: number | undefined) {
  return useQuery({
    queryKey: ['cocktail', id],
    queryFn: () => getCocktailDetail(id!),
    enabled: !!id,
  })
}
