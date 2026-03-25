from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.ingredient import IngredientStatus


class IngredientBase(BaseModel):
    name: str
    category: str
    subcategory: Optional[str] = None
    status: IngredientStatus = IngredientStatus.IN_STOCK


class IngredientCreate(IngredientBase):
    pass


class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    status: Optional[IngredientStatus] = None


class IngredientStatusUpdate(BaseModel):
    status: IngredientStatus


class IngredientResponse(IngredientBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
