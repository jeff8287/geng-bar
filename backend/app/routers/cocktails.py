from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import TokenData
from app.schemas.cocktail import CocktailCreate, CocktailResponse, CocktailUpdate
from app.services.auth_service import require_admin
from app.services.cocktail_service import CocktailService
from app.services.menu_service import _compute_avg_rating

router = APIRouter()


@router.get("/", response_model=list[CocktailResponse])
def list_cocktails(
    db: Session = Depends(get_db),
    _: TokenData = Depends(require_admin),
):
    cocktails = CocktailService.get_all(db)
    result = []
    for c in cocktails:
        r = CocktailResponse.model_validate(c)
        r.avg_rating = _compute_avg_rating(c)
        result.append(r)
    return result


@router.post("/", response_model=CocktailResponse, status_code=status.HTTP_201_CREATED)
def create_cocktail(
    body: CocktailCreate,
    db: Session = Depends(get_db),
    _: TokenData = Depends(require_admin),
):
    cocktail = CocktailService.create(db, body)
    response = CocktailResponse.model_validate(cocktail)
    response.avg_rating = _compute_avg_rating(cocktail)
    return response


@router.put("/{cocktail_id}", response_model=CocktailResponse)
def update_cocktail(
    cocktail_id: int,
    body: CocktailUpdate,
    db: Session = Depends(get_db),
    _: TokenData = Depends(require_admin),
):
    cocktail = CocktailService.update(db, cocktail_id, body)
    response = CocktailResponse.model_validate(cocktail)
    response.avg_rating = _compute_avg_rating(cocktail)
    return response


@router.delete("/{cocktail_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cocktail(
    cocktail_id: int,
    db: Session = Depends(get_db),
    _: TokenData = Depends(require_admin),
):
    CocktailService.delete(db, cocktail_id)
