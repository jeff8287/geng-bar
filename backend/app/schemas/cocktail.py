from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CocktailIngredientBase(BaseModel):
    ingredient_id: int
    amount: Optional[str] = None
    unit: Optional[str] = None
    is_optional: bool = False


class CocktailIngredientResponse(CocktailIngredientBase):
    model_config = ConfigDict(from_attributes=True)

    ingredient_name: Optional[str] = None


class CocktailBase(BaseModel):
    name: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    source_url: Optional[str] = None
    source_site: Optional[str] = None
    category: Optional[str] = None
    glass_type: Optional[str] = None
    garnish: Optional[str] = None
    difficulty: Optional[str] = None
    alcohol_level: Optional[float] = None
    flavor_profile: Optional[dict] = None
    image_url: Optional[str] = None
    image_local_path: Optional[str] = None


class CocktailCreate(CocktailBase):
    ingredients: list[CocktailIngredientBase] = []


class CocktailUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    source_url: Optional[str] = None
    source_site: Optional[str] = None
    category: Optional[str] = None
    glass_type: Optional[str] = None
    garnish: Optional[str] = None
    difficulty: Optional[str] = None
    alcohol_level: Optional[float] = None
    flavor_profile: Optional[dict] = None
    image_url: Optional[str] = None
    image_local_path: Optional[str] = None
    ingredients: Optional[list[CocktailIngredientBase]] = None


class CocktailResponse(CocktailBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    ingredients: list[CocktailIngredientResponse] = []
    avg_rating: Optional[float] = None


class CocktailListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: Optional[str] = None
    alcohol_level: Optional[float] = None
    flavor_profile: Optional[dict] = None
    image_url: Optional[str] = None
    image_local_path: Optional[str] = None
    avg_rating: Optional[float] = None
    is_available: bool = True
