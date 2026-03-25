import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  updateIngredientStatus,
} from '../api/ingredients'

export function useIngredients(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['ingredients'],
    queryFn: getIngredients,
    refetchInterval: options?.refetchInterval,
  })
}

export function useCreateIngredient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      name: string
      category: string
      subcategory?: string
      status: 'in_stock' | 'low' | 'out_of_stock'
    }) => createIngredient(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      toast.success('Ingredient added')
    },
    onError: () => toast.error('Failed to add ingredient'),
  })
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<{ name: string; category: string; subcategory?: string; status: 'in_stock' | 'low' | 'out_of_stock' }> }) =>
      updateIngredient(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      toast.success('Ingredient updated')
    },
    onError: () => toast.error('Failed to update ingredient'),
  })
}

export function useUpdateIngredientStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'in_stock' | 'low' | 'out_of_stock' }) =>
      updateIngredientStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['menu'] })
    },
    onError: () => toast.error('Failed to update status'),
  })
}
