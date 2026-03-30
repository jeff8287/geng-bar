from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.cocktail import Cocktail, CocktailIngredient
from app.models.ingredient import Ingredient, IngredientStatus
from app.schemas.cocktail import CocktailCreate, CocktailUpdate


# Categories used for flavor profile estimation
_SPIRIT_CATEGORIES = {"spirit", "spirits", "whiskey", "whisky", "vodka", "gin", "rum", "tequila", "brandy"}
_SYRUP_CATEGORIES = {"syrup", "syrups", "liqueur", "liqueurs", "cordial"}
_CITRUS_CATEGORIES = {"citrus", "juice", "juices", "lemon", "lime", "orange"}
_BITTER_CATEGORIES = {"bitters", "bitter", "amaro"}
_BITTER_NAMES = {"campari", "fernet", "angostura", "peychaud", "averna", "amaro", "chartreuse", "punt e mes", "aperol"}
_FRUIT_CATEGORIES = {"fruit", "fruits", "berry", "berries", "tropical"}

# Name-based detection for ingredients with category="Other"
_SPIRIT_NAMES = {
    "vodka", "gin", "rum", "whisky", "whiskey", "tequila", "brandy", "bourbon", "mezcal",
    "rye whiskey", "rye", "white rum", "dark rum", "gold rum", "coconut rum", "spiced rum",
    "islay whisky", "earl grey infused gin", "french black tea infused gin",
}
_SWEET_NAMES = {
    "kahlua", "baileys", "disaronno", "cointreau", "simple syrup", "honey syrup", "grenadine", "sugar",
    "cream", "milk", "coconut cream", "creme de banana", "creme de cacao", "creme de menthe",
    "creme de noyaux", "orgeat syrup", "falernum", "galliano", "frangelico", "drambuie",
    "maraschino liqueur", "grand marnier", "passion fruit syrup", "raspberry syrup",
    "peach schnapps", "blue curacao", "orange curacao", "sweet vermouth", "st germain",
    "limoncello", "benedictine",
}
_SOUR_NAMES = {"lemon juice", "lime juice", "grapefruit juice", "orange juice", "lemon", "lime", "cranberry juice"}
_FRUITY_NAMES = {
    "pineapple juice", "orange juice", "cranberry juice", "grapefruit juice", "passion fruit",
    "strawberry", "cassis", "cherry heering", "creme de banana", "grenadine",
}


def estimate_flavor_profile(ingredients: list[Ingredient]) -> dict:
    """Estimate flavor profile (0.0-1.0 scores) from ingredient categories and names."""
    boozy = 0.0
    sweet = 0.0
    sour = 0.0
    bitter = 0.0
    fruity = 0.0

    for ing in ingredients:
        cat = (ing.category or "").lower()
        name = (ing.name or "").lower()

        if cat in _SPIRIT_CATEGORIES or name in _SPIRIT_NAMES:
            boozy = min(1.0, boozy + 0.5)
        if cat in _SYRUP_CATEGORIES or name in _SWEET_NAMES or any(s in name for s in _SWEET_NAMES):
            sweet = min(1.0, sweet + 0.5)
        if cat in _CITRUS_CATEGORIES or name in _SOUR_NAMES or any(s in name for s in _SOUR_NAMES):
            sour = min(1.0, sour + 0.5)
        if cat in _BITTER_CATEGORIES or any(b in name for b in _BITTER_NAMES):
            bitter = min(1.0, bitter + 0.5)
        if cat in _FRUIT_CATEGORIES or name in _FRUITY_NAMES or any(f in name for f in _FRUITY_NAMES):
            fruity = min(1.0, fruity + 0.5)

    return {
        "boozy": round(boozy, 2),
        "sweet": round(sweet, 2),
        "sour": round(sour, 2),
        "bitter": round(bitter, 2),
        "fruity": round(fruity, 2),
    }


class CocktailService:
    @staticmethod
    def get_all(db: Session) -> list[Cocktail]:
        return (
            db.query(Cocktail)
            .options(joinedload(Cocktail.ingredient_links).joinedload(CocktailIngredient.ingredient))
            .order_by(Cocktail.name)
            .all()
        )

    @staticmethod
    def get_by_id(db: Session, cocktail_id: int) -> Cocktail:
        cocktail = (
            db.query(Cocktail)
            .options(
                joinedload(Cocktail.ingredient_links).joinedload(CocktailIngredient.ingredient),
                joinedload(Cocktail.reviews),
            )
            .filter(Cocktail.id == cocktail_id)
            .first()
        )
        if not cocktail:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cocktail {cocktail_id} not found",
            )
        return cocktail

    @staticmethod
    def create(db: Session, schema: CocktailCreate) -> Cocktail:
        existing = db.query(Cocktail).filter(Cocktail.name == schema.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cocktail '{schema.name}' already exists",
            )
        cocktail_data = schema.model_dump(exclude={"ingredients"})
        cocktail = Cocktail(**cocktail_data)
        db.add(cocktail)
        db.flush()  # get cocktail.id before adding links

        for ing_schema in schema.ingredients:
            link = CocktailIngredient(
                cocktail_id=cocktail.id,
                ingredient_id=ing_schema.ingredient_id,
                amount=ing_schema.amount,
                unit=ing_schema.unit,
                is_optional=ing_schema.is_optional,
            )
            db.add(link)

        # Auto-estimate flavor profile if not provided
        if not cocktail.flavor_profile and schema.ingredients:
            ingredient_ids = [i.ingredient_id for i in schema.ingredients]
            ingredients = db.query(Ingredient).filter(Ingredient.id.in_(ingredient_ids)).all()
            cocktail.flavor_profile = estimate_flavor_profile(ingredients)

        db.commit()
        db.refresh(cocktail)
        return CocktailService.get_by_id(db, cocktail.id)

    @staticmethod
    def update(db: Session, cocktail_id: int, schema: CocktailUpdate) -> Cocktail:
        cocktail = CocktailService.get_by_id(db, cocktail_id)
        update_data = schema.model_dump(exclude_unset=True, exclude={"ingredients"})
        for field, value in update_data.items():
            setattr(cocktail, field, value)

        if schema.ingredients is not None:
            # Replace all ingredient links
            db.query(CocktailIngredient).filter(
                CocktailIngredient.cocktail_id == cocktail_id
            ).delete()
            for ing_schema in schema.ingredients:
                link = CocktailIngredient(
                    cocktail_id=cocktail_id,
                    ingredient_id=ing_schema.ingredient_id,
                    amount=ing_schema.amount,
                    unit=ing_schema.unit,
                    is_optional=ing_schema.is_optional,
                )
                db.add(link)

        db.commit()
        return CocktailService.get_by_id(db, cocktail_id)

    @staticmethod
    def delete(db: Session, cocktail_id: int) -> None:
        cocktail = CocktailService.get_by_id(db, cocktail_id)
        db.delete(cocktail)
        db.commit()
