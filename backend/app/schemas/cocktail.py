from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, model_validator


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

    @model_validator(mode='before')
    @classmethod
    def map_ingredient_links(cls, data: Any) -> Any:
        if not hasattr(data, 'ingredient_links'):
            return data
        links = []
        for link in (data.ingredient_links or []):
            ingredient_name = None
            if hasattr(link, 'ingredient') and link.ingredient is not None:
                ingredient_name = link.ingredient.name
            links.append({
                'ingredient_id': link.ingredient_id,
                'amount': link.amount,
                'unit': link.unit,
                'is_optional': link.is_optional,
                'ingredient_name': ingredient_name,
            })
        # Build a plain dict instead of mutating the ORM instance
        result = {}
        for col in data.__mapper__.column_attrs.keys():
            result[col] = getattr(data, col)
        result['ingredients'] = links
        return result


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
