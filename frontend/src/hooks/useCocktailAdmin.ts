import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { createCocktail, updateCocktail, deleteCocktail } from '../api/cocktails'

export function useCreateCocktail() {
  const queryClient = useQueryClient()
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (payload: any) => createCocktail(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] })
      toast.success('Cocktail created')
    },
    onError: () => toast.error('Failed to create cocktail'),
  })
}

export function useUpdateCocktail() {
  const queryClient = useQueryClient()
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      updateCocktail(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] })
      queryClient.invalidateQueries({ queryKey: ['cocktail'] })
      toast.success('Cocktail updated')
    },
    onError: () => toast.error('Failed to update cocktail'),
  })
}

export function useDeleteCocktail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteCocktail(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] })
      toast.success('Cocktail deleted')
    },
    onError: () => toast.error('Failed to delete cocktail'),
  })
}
