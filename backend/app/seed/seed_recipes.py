"""
Seed exact recipe amounts into cocktail_ingredients from recipe.md.
"""
from __future__ import annotations

import re
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.cocktail import Cocktail, CocktailIngredient
from app.models.ingredient import Ingredient


# Matches amounts like: "1 1/2 oz", "2 oz", "4 dashes", "1/4 oz"
_AMOUNT_RE = re.compile(
    r"^"
    r"(\d+(?:\s+\d+/\d+)?|\d+/\d+)"   # quantity: "1 1/2", "2", "1/4"
    r"\s+"
    r"(\w+)"                            # unit: "oz", "dashes", "ml", ...
    r"\s+"
    r"(.+)$"                            # ingredient name
)

# "garnish: something"
_GARNISH_RE = re.compile(r"^garnish:\s*(.+)$", re.IGNORECASE)


def _parse_recipes(md_text: str) -> list[dict]:
    """
    Parse recipe.md and return a list of dicts:
      {
        name: str,
        ingredients: [{ raw_name: str, amount: str, unit: str }],
        garnishes: [str],
      }
    """
    recipes: list[dict] = []
    current: dict | None = None

    for line in md_text.splitlines():
        line = line.rstrip()

        # Cocktail heading: #### COCKTAIL_NAME
        heading_match = re.match(r"^####\s+(.+)$", line)
        if heading_match:
            current = {
                "name": heading_match.group(1).strip(),
                "ingredients": [],
                "garnishes": [],
            }
            recipes.append(current)
            continue

        # Ingredient bullet: * ...
        bullet_match = re.match(r"^\*\s+(.+)$", line)
        if bullet_match and current is not None:
            content = bullet_match.group(1).strip()

            # Garnish line
            garnish_match = _GARNISH_RE.match(content)
            if garnish_match:
                current["garnishes"].append(garnish_match.group(1).strip())
                continue

            # Amount + unit + name
            amount_match = _AMOUNT_RE.match(content)
            if amount_match:
                quantity, unit, ing_name = amount_match.groups()
                # Normalize quantity: remove internal extra spaces
                quantity = " ".join(quantity.split())
                ing_name = ing_name.strip()
                current["ingredients"].append(
                    {"raw_name": ing_name, "amount": quantity, "unit": unit}
                )
            else:
                # No recognized amount pattern; store with no amount/unit
                current["ingredients"].append(
                    {"raw_name": content, "amount": None, "unit": None}
                )

    return recipes


def _find_ingredient(db: Session, name: str) -> Ingredient | None:
    """Case-insensitive then partial ingredient lookup."""
    name_lower = name.lower()
    all_ingredients = db.query(Ingredient).all()
    for ing in all_ingredients:
        if ing.name.lower() == name_lower:
            return ing
    for ing in all_ingredients:
        ing_lower = ing.name.lower()
        if name_lower in ing_lower or ing_lower in name_lower:
            return ing
    return None


def seed_recipes(db: Session, md_path: str) -> int:
    """
    Parse recipe.md and update cocktail_ingredients with amounts/units.
    Also sets the cocktail's garnish field.
    Returns count of cocktails updated.
    """
    path = Path(md_path)
    md_text = path.read_text(encoding="utf-8")

    recipes = _parse_recipes(md_text)

    updated = 0
    for recipe in recipes:
        name = recipe["name"]

        # Case-insensitive cocktail lookup
        cocktail = (
            db.query(Cocktail)
            .filter(Cocktail.name.ilike(name))
            .first()
        )
        if not cocktail:
            # Try partial match
            cocktail = (
                db.query(Cocktail)
                .filter(Cocktail.name.ilike(f"%{name}%"))
                .first()
            )
        if not cocktail:
            continue

        # Update garnish
        if recipe["garnishes"]:
            cocktail.garnish = ", ".join(recipe["garnishes"])

        # Update ingredient amounts
        for ing_data in recipe["ingredients"]:
            ingredient = _find_ingredient(db, ing_data["raw_name"])
            if ingredient is None:
                continue

            link = (
                db.query(CocktailIngredient)
                .filter(
                    CocktailIngredient.cocktail_id == cocktail.id,
                    CocktailIngredient.ingredient_id == ingredient.id,
                )
                .first()
            )
            if link:
                link.amount = ing_data["amount"]
                link.unit = ing_data["unit"]

        updated += 1

    db.commit()
    return updated
