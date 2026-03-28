from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.cocktail import CocktailListResponse, CocktailResponse
from app.schemas.ingredient import IngredientResponse
from app.services.cocktail_service import CocktailService
from app.services.menu_service import MenuService, _compute_avg_rating

router = APIRouter()


@router.get("/ingredients", response_model=list[IngredientResponse])
def get_available_ingredients(db: Session = Depends(get_db)):
    """Guest-facing: list ingredients that are in stock or low."""
    return MenuService.get_in_stock_ingredients(db)



@router.get("/", response_model=list[CocktailListResponse])
def get_menu(
    category: Optional[str] = Query(None, description="Filter by category"),
    available_only: bool = Query(False, description="Only show available cocktails"),
    search: Optional[str] = Query(None, description="Search by name"),
    db: Session = Depends(get_db),
):
    """Guest-facing menu with availability filter."""
    return MenuService.get_menu(db, category=category, available_only=available_only, search=search)


@router.get("/{cocktail_id}", response_model=CocktailResponse)
def get_cocktail_detail(cocktail_id: int, db: Session = Depends(get_db)):
    """Get cocktail detail with ingredients, reviews, and avg_rating."""
    cocktail = CocktailService.get_by_id(db, cocktail_id)
    # Attach avg_rating as computed property
    response = CocktailResponse.model_validate(cocktail)
    response.avg_rating = _compute_avg_rating(cocktail)
    return response
