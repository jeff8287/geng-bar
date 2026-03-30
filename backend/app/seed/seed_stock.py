"""
Seed ingredients from stock.yaml into the ingredients table.

stock.yaml is parsed by PyYAML as flat strings joined by " - " due to
indentation style. E.g.:
  "Gin - Gordons * - Tanqueray - Bombay Sapphire"
  "Whisky - Single Malt (peated) - Laphroaig 10 * - ... - Bourbon - Bulleit *"

This module splits those strings to extract subcategory + ingredient names.
"""
from __future__ import annotations

from pathlib import Path

import yaml
from sqlalchemy.orm import Session

from app.models.ingredient import Ingredient, IngredientStatus
from app.seed.seed_menu import _guess_category

# Known subcategory markers within spirit groups (case-insensitive comparison)
_WHISKY_SUBCATS = {
    "single malt",
    "single malt (peated)",
    "single malt (non-peated)",
    "blended",
    "bourbon",
    "peated",
}


def _clean_name(name: str) -> str:
    """Strip trailing ' *' marker and surrounding whitespace."""
    cleaned = name.strip()
    if cleaned.endswith("*"):
        cleaned = cleaned[:-1].rstrip()
    return cleaned


def _parse_spirit_string(raw: str, category: str, status: IngredientStatus) -> list[dict]:
    """Parse a ' - ' joined spirit string into individual ingredients.

    First token is the spirit type (e.g. Gin, Whisky, Rum).
    Subsequent tokens are either subcategory markers or ingredient names.
    """
    parts = [p.strip() for p in raw.split(" - ") if p.strip()]
    if not parts:
        return []

    spirit_type = _clean_name(parts[0])  # e.g. "Gin", "Whisky"
    results = []
    current_sub = spirit_type  # default subcategory = spirit type

    for part in parts[1:]:
        name = _clean_name(part)
        if not name:
            continue

        # Check if this is a subcategory marker (for Whisky-like nested groups)
        if name.lower() in _WHISKY_SUBCATS:
            current_sub = name
            continue

        results.append({
            "name": name,
            "category": category,
            "subcategory": current_sub,
            "status": status,
        })

    # If only the spirit type itself, no sub-items (e.g. "Mezcal" standalone)
    if not results and spirit_type:
        results.append({
            "name": spirit_type,
            "category": category,
            "subcategory": None,
            "status": status,
        })

    return results


def _parse_simple_string(raw: str, category: str, status: IngredientStatus) -> list[dict]:
    """Parse a simple string (possibly with ' - ' for sub-items under non-spirit categories)."""
    parts = [p.strip() for p in raw.split(" - ") if p.strip()]
    if not parts:
        return []

    # For non-spirit categories with sub-items (e.g. "etc - Grappa Nonino - Arak Bali")
    if len(parts) > 1:
        subcategory = _clean_name(parts[0])
        results = []
        for part in parts[1:]:
            name = _clean_name(part)
            if name:
                results.append({
                    "name": name,
                    "category": category,
                    "subcategory": subcategory,
                    "status": status,
                })
        return results

    name = _clean_name(parts[0])
    if not name:
        return []
    return [{
        "name": name,
        "category": category,
        "subcategory": None,
        "status": status,
    }]


def _parse_yaml_items(data: dict) -> list[dict]:
    """Walk the YAML structure and return flat ingredient dicts."""
    results = []

    for top_key, top_val in data.items():
        if top_key.lower() == "etc":
            category = "Other"  # default, overridden per-item below
        elif top_key == "Absent":
            category = "Other"  # default, overridden per-item below
        else:
            category = top_key
        use_name_category = top_key.lower() == "etc" or top_key == "Absent"

        status = IngredientStatus.OUT_OF_STOCK if top_key == "Absent" else IngredientStatus.IN_STOCK

        if not isinstance(top_val, list):
            continue

        for item in top_val:
            if item is None or (isinstance(item, str) and not item.strip()):
                continue

            raw = str(item)

            # Spirits have nested subcategory structure
            if top_key == "Spirits":
                results.extend(_parse_spirit_string(raw, category, status))
            else:
                parsed = _parse_simple_string(raw, category, status)
                if use_name_category:
                    for p in parsed:
                        guessed = _guess_category(p["name"])
                        if guessed != "Other":
                            p["category"] = guessed
                results.extend(parsed)

    return results


def seed_stock(db: Session, yaml_path: str) -> int:
    """Parse stock.yaml and upsert ingredients into the DB.

    Returns the count of seeded (created or updated) ingredients.
    """
    path = Path(yaml_path)
    with path.open("r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh)

    if not data:
        return 0

    items = _parse_yaml_items(data)

    count = 0
    seen_names: set[str] = set()
    for item in items:
        name = item["name"]
        if name in seen_names:
            continue
        seen_names.add(name)
        existing = db.query(Ingredient).filter(Ingredient.name == name).first()
        if existing:
            existing.category = item["category"]
            existing.subcategory = item["subcategory"]
            existing.status = item["status"]
        else:
            ingredient = Ingredient(
                name=name,
                category=item["category"],
                subcategory=item["subcategory"],
                status=item["status"],
            )
            db.add(ingredient)
            db.flush()
        count += 1

    db.commit()
    return count
