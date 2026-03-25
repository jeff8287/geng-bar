import client from './client'
import type { Review } from '../types'

export async function getReviews(cocktailId: number): Promise<Review[]> {
  const response = await client.get<Review[]>(`/reviews/${cocktailId}`)
  return response.data
}

export async function createReview(
  cocktailId: number,
  data: { rating: number; comment?: string }
): Promise<Review> {
  const response = await client.post<Review>(`/reviews/${cocktailId}`, data)
  return response.data
}
