import client from './client'
import type { CocktailListItem, CocktailDetail, MenuFilters } from '../types'

export async function getMenu(filters?: MenuFilters): Promise<CocktailListItem[]> {
  const params: Record<string, string | boolean> = {}
  if (filters?.category && filters.category !== 'all') params.category = filters.category
  if (filters?.search) params.search = filters.search
  if (filters?.available_only) params.available_only = true
  const response = await client.get<CocktailListItem[]>('/menu/', { params })
  return response.data
}

export async function getCocktailDetail(id: number): Promise<CocktailDetail> {
  const response = await client.get<CocktailDetail>(`/menu/${id}`)
  return response.data
}

// Admin endpoints
export async function getAllCocktailsAdmin(): Promise<CocktailDetail[]> {
  const response = await client.get<CocktailDetail[]>('/cocktails/')
  return response.data
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createCocktail(payload: any): Promise<CocktailDetail> {
  const response = await client.post<CocktailDetail>('/cocktails/', payload)
  return response.data
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateCocktail(id: number, payload: any): Promise<CocktailDetail> {
  const response = await client.put<CocktailDetail>(`/cocktails/${id}`, payload)
  return response.data
}

export async function deleteCocktail(id: number): Promise<void> {
  await client.delete(`/cocktails/${id}`)
}
