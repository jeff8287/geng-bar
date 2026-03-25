import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import type { AppSettings } from '../types'

export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await client.get<AppSettings>('/admin/settings')
      return res.data
    },
  })
}

export function useUpdateFilterMode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (mode: 'strict' | 'flexible') => {
      const res = await client.patch<AppSettings>('/admin/settings', { filter_mode: mode })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['admin-settings'], data)
    },
  })
}
