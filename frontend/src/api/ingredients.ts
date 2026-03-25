import client from './client'
import type { Ingredient } from '../types'

interface CreateIngredientPayload {
  name: string
  category: string
  subcategory?: string
  status: 'in_stock' | 'low' | 'out_of_stock'
}

export async function getIngredients(): Promise<Ingredient[]> {
  const response = await client.get<Ingredient[]>('/ingredients')
  return response.data
}

export async function getIngredient(id: number): Promise<Ingredient> {
  const response = await client.get<Ingredient>(`/ingredients/${id}`)
  return response.data
}

export async function createIngredient(payload: CreateIngredientPayload): Promise<Ingredient> {
  const response = await client.post<Ingredient>('/ingredients', payload)
  return response.data
}

export async function updateIngredient(id: number, payload: Partial<CreateIngredientPayload>): Promise<Ingredient> {
  const response = await client.put<Ingredient>(`/ingredients/${id}`, payload)
  return response.data
}

export async function updateIngredientStatus(
  id: number,
  status: 'in_stock' | 'low' | 'out_of_stock'
): Promise<Ingredient> {
  const response = await client.patch<Ingredient>(`/ingredients/${id}/status`, { status })
  return response.data
}

export async function deleteIngredient(id: number): Promise<void> {
  await client.delete(`/ingredients/${id}`)
}
