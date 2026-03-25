// Matches backend CocktailListResponse
export interface CocktailListItem {
  id: number
  name: string
  category?: string
  alcohol_level?: number
  flavor_profile?: FlavorProfile
  image_url?: string
  image_local_path?: string
  avg_rating?: number
  is_available: boolean
}

// Matches backend CocktailResponse
export interface CocktailDetail {
  id: number
  name: string
  description?: string
  instructions?: string
  source_url?: string
  source_site?: string
  category?: string
  glass_type?: string
  garnish?: string
  difficulty?: string
  alcohol_level?: number
  flavor_profile?: FlavorProfile
  image_url?: string
  image_local_path?: string
  created_at: string
  updated_at: string
  ingredients: CocktailIngredientResponse[]
  avg_rating?: number
}

export interface CocktailIngredientResponse {
  ingredient_id: number
  ingredient_name?: string
  amount?: string
  unit?: string
  is_optional: boolean
}

export interface FlavorProfile {
  sweet: number
  sour: number
  bitter: number
  boozy: number
  fruity: number
}

export interface Review {
  id: number
  nickname: string
  rating: number
  comment?: string
  cocktail_id: number
  created_at: string
}

export interface Ingredient {
  id: number
  name: string
  category: string
  subcategory?: string
  status: 'in_stock' | 'low' | 'out_of_stock'
  created_at: string
  updated_at: string
}

export interface AppSettings {
  filter_mode: 'strict' | 'flexible'
  updated_at: string
}

export interface User {
  nickname?: string
  username?: string
  isAdmin: boolean
}

export interface AuthState {
  token: string | null
  user: User | null
}

export interface MenuFilters {
  category?: string
  search?: string
  available_only?: boolean
  favorites_only?: boolean
}
