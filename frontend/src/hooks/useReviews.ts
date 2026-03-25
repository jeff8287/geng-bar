import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getReviews, createReview } from '../api/reviews'

export function useReviews(cocktailId: number | undefined) {
  return useQuery({
    queryKey: ['reviews', cocktailId],
    queryFn: () => getReviews(cocktailId!),
    enabled: !!cocktailId,
  })
}

export function useCreateReview(cocktailId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { rating: number; comment?: string }) =>
      createReview(cocktailId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', cocktailId] })
      queryClient.invalidateQueries({ queryKey: ['cocktail', cocktailId] })
    },
  })
}
