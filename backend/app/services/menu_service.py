from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models.cocktail import Cocktail, CocktailIngredient
from app.models.ingredient import IngredientStatus
from app.models.settings import AppSettings, FilterMode
from app.schemas.cocktail import CocktailListResponse


def _compute_avg_rating(cocktail: Cocktail) -> Optional[float]:
    if not cocktail.reviews:
        return None
    return round(sum(r.rating for r in cocktail.reviews) / len(cocktail.reviews), 2)


def _is_cocktail_available(cocktail: Cocktail) -> bool:
    """Return True if all non-optional ingredients are in_stock or low."""
    for link in cocktail.ingredient_links:
        if link.is_optional:
            continue
        if link.ingredient is None:
            return False
        if link.ingredient.status == IngredientStatus.OUT_OF_STOCK:
            return False
    return True


def get_filter_mode(db: Session) -> FilterMode:
    settings_row = db.query(AppSettings).first()
    if settings_row:
        return settings_row.filter_mode
    return FilterMode.STRICT


class MenuService:
    @staticmethod
    def get_menu(
        db: Session,
        category: Optional[str] = None,
        available_only: bool = False,
        search: Optional[str] = None,
    ) -> list[CocktailListResponse]:
        filter_mode = get_filter_mode(db)

        query = (
            db.query(Cocktail)
            .options(
                joinedload(Cocktail.ingredient_links).joinedload(CocktailIngredient.ingredient),
                joinedload(Cocktail.reviews),
            )
        )

        if category:
            query = query.filter(Cocktail.category == category)

        if search:
            query = query.filter(Cocktail.name.ilike(f"%{search}%"))

        cocktails = query.order_by(Cocktail.name).all()

        result = []
        for cocktail in cocktails:
            is_available = _is_cocktail_available(cocktail)

            if filter_mode == FilterMode.STRICT and available_only and not is_available:
                continue
            if available_only and not is_available:
                continue

            result.append(
                CocktailListResponse(
                    id=cocktail.id,
                    name=cocktail.name,
                    category=cocktail.category,
                    alcohol_level=cocktail.alcohol_level,
                    flavor_profile=cocktail.flavor_profile,
                    image_url=cocktail.image_url,
                    image_local_path=cocktail.image_local_path,
                    avg_rating=_compute_avg_rating(cocktail),
                    is_available=is_available,
                )
            )

        return result
