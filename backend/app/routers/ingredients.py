from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import TokenData
from app.schemas.ingredient import (
    IngredientCreate,
    IngredientResponse,
    IngredientStatusUpdate,
    IngredientUpdate,
)
from app.services.auth_service import require_admin
from app.services.ingredient_service import IngredientService

router = APIRouter()


@router.get("/", response_model=list[IngredientResponse])
def list_ingredients(
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
    _: TokenData = Depends(require_admin),
):
    return IngredientService.get_all(db, category=category)


@router.post("/", response_model=IngredientResponse, status_code=status.HTTP_201_CREATED)
def create_ingredient(
    body: IngredientCreate,
    db: Session = Depends(get_db),
    _: TokenData = Depends(require_admin),
):
    return IngredientService.create(db, body)


@router.put("/{ingredient_id}", response_model=IngredientResponse)
def update_ingredient(
    ingredient_id: int,
    body: IngredientUpdate,
    db: Session = Depends(get_db),
    _: TokenData = Depends(require_admin),
):
    return IngredientService.update(db, ingredient_id, body)


@router.patch("/{ingredient_id}/status", response_model=IngredientResponse)
def update_ingredient_status(
    ingredient_id: int,
    body: IngredientStatusUpdate,
    db: Session = Depends(get_db),
    _: TokenData = Depends(require_admin),
):
    return IngredientService.update_status(db, ingredient_id, body)


@router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ingredient(
    ingredient_id: int,
    db: Session = Depends(get_db),
    _: TokenData = Depends(require_admin),
):
    IngredientService.delete(db, ingredient_id)
