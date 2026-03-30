"""
Seed cocktails and cocktail_ingredients from menu-all.md.
"""
from __future__ import annotations

import re
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.cocktail import Cocktail, CocktailIngredient
from app.models.ingredient import Ingredient
from app.services.cocktail_service import estimate_flavor_profile

# Markdown category -> DB category slug
_CATEGORY_MAP = {
    "SEASONAL (TEA)": "seasonal",
    "REFRESHING": "refreshing",
    "SWEET / CREAMY": "sweet",
    "COMPLEX / BOOZY": "complex",
    "TROPICAL / LONG": "tropical",
    "SHOTS & SHOOTER": "shots",
}


def _parse_menu(md_text: str) -> list[dict]:
    """
    Parse menu-all.md and return a list of dicts:
      { name: str, category: str, ingredients: list[str] }
    """
    cocktails = []
    current_category = None

    for line in md_text.splitlines():
        line = line.rstrip()

        # Category heading: ### CATEGORY_NAME
        cat_match = re.match(r"^###\s+(.+)$", line)
        if cat_match:
            raw_cat = cat_match.group(1).strip()
            current_category = _CATEGORY_MAP.get(raw_cat, raw_cat.lower())
            continue

        # Cocktail heading: ##### - NAME  or  - NAME (shots section uses bullet)
        cocktail_match = re.match(r"^#{1,6}\s+-\s+(.+)$", line) or re.match(
            r"^-\s+([A-Z][A-Z &']+)$", line
        )
        if cocktail_match and current_category:
            name = cocktail_match.group(1).strip()
            cocktails.append(
                {"name": name, "category": current_category, "ingredients": []}
            )
            continue

        # Ingredient line: _ingredient1, ingredient2, ..._
        ing_match = re.match(r"^_(.+)_$", line)
        if ing_match and cocktails:
            raw = ing_match.group(1)
            ingredients = [i.strip() for i in raw.split(",") if i.strip()]
            cocktails[-1]["ingredients"] = ingredients

    return cocktails


def _find_ingredient(db: Session, name: str) -> Ingredient | None:
    """
    Try to find an existing ingredient by:
    1. Exact match (case-insensitive)
    2. Partial match: ingredient name contains the search term or vice versa
    Returns None if not found.
    """
    name_lower = name.lower()

    # 1. Exact case-insensitive match
    all_ingredients = db.query(Ingredient).all()
    for ing in all_ingredients:
        if ing.name.lower() == name_lower:
            return ing

    # 2. Partial match
    for ing in all_ingredients:
        ing_lower = ing.name.lower()
        if name_lower in ing_lower or ing_lower in name_lower:
            return ing

    return None


def _guess_category(name: str) -> str:
    """Guess an ingredient category from its name using known keyword patterns."""
    n = name.lower().strip()

    SPIRITS = {
        "vodka", "whisky", "whiskey", "rum", "gin", "tequila", "brandy",
        "mezcal", "bourbon", "rye whiskey", "rye", "peated whisky",
        "white rum", "dark rum", "gold rum", "coconut rum", "spiced rum",
        "islay whisky", "earl grey infused gin", "french black tea infused gin",
    }
    LIQUEURS = {
        "kahlua", "baileys", "cointreau", "campari", "aperol",
        "fernet branca", "fernet menta", "sweet vermouth", "dry vermouth",
        "disaronno", "drambuie", "cassis", "st germain", "limoncello",
        "green chartreuse", "yellow chartreuse", "cherry heering",
        "maraschino liqueur", "lillet blanc", "galliano", "frangelico",
        "benedictine", "absinthe", "blue curacao", "orange curacao",
        "falernum", "peach schnapps", "jagermeister", "amaro nonino",
        "grand marnier", "punt e mes",
    }
    JUICES = {
        "soda water", "club soda", "ginger ale", "ginger beer", "tonic water",
        "cola", "coke", "lemon juice", "lime juice", "orange juice",
        "cranberry juice", "grapefruit juice", "pineapple juice",
        "tomato juice", "clamato juice", "espresso", "coffee",
        "prosecco", "champagne", "lemonade", "energy drink", "beer",
        "cold brew coffee", "oolong tea",
    }
    BITTERS = {
        "angostura bitters", "orange bitters", "chocolate bitters",
        "peychaud's bitters", "celery bitters", "aromatic bitters",
    }
    SYRUPS = {
        "simple syrup", "honey syrup", "grenadine", "orgeat syrup",
        "raspberry syrup", "passion fruit syrup", "sugar",
    }
    HERBS = {"basil", "mint"}
    FRUITS = {"lemon", "lime", "orange", "strawberry"}
    if n in SPIRITS:
        return "Spirits"
    if n in LIQUEURS or n.startswith("creme de"):
        return "Liqueurs"
    if n in JUICES:
        return "Juices"
    if n in BITTERS:
        return "Bitters"
    if n in HERBS:
        return "Herbs"
    if n in FRUITS:
        return "Fruits"
    if n in SYRUPS:
        return "Syrups"
    return "Other"


def _get_or_create_ingredient(db: Session, name: str) -> Ingredient:
    """
    Return an existing ingredient (fuzzy match) or create a generic one.
    The created ingredient has category guessed from its name.
    """
    existing = _find_ingredient(db, name)
    if existing:
        return existing

    # Create a generic ingredient so the cocktail link can be established
    ingredient = Ingredient(name=name, category=_guess_category(name), subcategory=None)
    db.add(ingredient)
    db.flush()  # get id without committing
    return ingredient


def seed_menu(db: Session, md_path: str) -> int:
    """
    Parse menu-all.md and insert cocktails + cocktail_ingredients.
    Returns the count of seeded cocktails.
    """
    path = Path(md_path)
    md_text = path.read_text(encoding="utf-8")

    cocktail_entries = _parse_menu(md_text)

    count = 0
    for entry in cocktail_entries:
        name = entry["name"]
        category = entry["category"]
        ingredient_names = entry["ingredients"]

        # Skip if already exists
        existing = db.query(Cocktail).filter(Cocktail.name == name).first()
        if existing:
            cocktail = existing
        else:
            cocktail = Cocktail(name=name, category=category)
            db.add(cocktail)
            db.flush()
            count += 1

        # Remove existing links to avoid duplicates on re-seed
        db.query(CocktailIngredient).filter(
            CocktailIngredient.cocktail_id == cocktail.id
        ).delete()

        linked_ingredients: list[Ingredient] = []
        seen_ingredient_ids: set[int] = set()
        for ing_name in ingredient_names:
            ingredient = _get_or_create_ingredient(db, ing_name)
            if ingredient.id in seen_ingredient_ids:
                continue  # skip duplicate ingredient links
            seen_ingredient_ids.add(ingredient.id)
            link = CocktailIngredient(
                cocktail_id=cocktail.id,
                ingredient_id=ingredient.id,
            )
            db.add(link)
            linked_ingredients.append(ingredient)

        # Estimate flavor profile
        if linked_ingredients:
            cocktail.flavor_profile = estimate_flavor_profile(linked_ingredients)

    db.commit()
    return count
