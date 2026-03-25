import logging
from pathlib import Path

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

UNMATCHED_LOG = Path(__file__).parent / "unmatched.log"

# Maps common variations to canonical ingredient names
NORMALIZATION_MAP: dict[str, str] = {
    # Lemon
    "fresh lemon juice": "Lemon Juice",
    "freshly squeezed lemon juice": "Lemon Juice",
    "fresh-squeezed lemon juice": "Lemon Juice",
    "lemon juice, freshly squeezed": "Lemon Juice",
    "lemon juice fresh": "Lemon Juice",
    # Lime
    "fresh lime juice": "Lime Juice",
    "freshly squeezed lime juice": "Lime Juice",
    "fresh-squeezed lime juice": "Lime Juice",
    "lime juice, freshly squeezed": "Lime Juice",
    "lime juice fresh": "Lime Juice",
    # Orange
    "fresh orange juice": "Orange Juice",
    "freshly squeezed orange juice": "Orange Juice",
    # Grapefruit
    "fresh grapefruit juice": "Grapefruit Juice",
    "freshly squeezed grapefruit juice": "Grapefruit Juice",
    # Simple syrup
    "simple syrup (1:1)": "Simple Syrup",
    "simple syrup (2:1)": "Rich Simple Syrup",
    "rich simple syrup": "Rich Simple Syrup",
    "rich syrup": "Rich Simple Syrup",
    "2:1 simple syrup": "Rich Simple Syrup",
    "demerara syrup": "Demerara Syrup",
    "demerara simple syrup": "Demerara Syrup",
    "cane sugar syrup": "Simple Syrup",
    "sugar syrup": "Simple Syrup",
    # Bitters
    "angostura aromatic bitters": "Angostura Bitters",
    "angostura aromatic bitters®": "Angostura Bitters",
    "angostura": "Angostura Bitters",
    "peychaud's bitters": "Peychaud's Bitters",
    "peychauds bitters": "Peychaud's Bitters",
    "orange bitters": "Orange Bitters",
    "regan's orange bitters": "Orange Bitters",
    "regans' orange bitters": "Orange Bitters",
    "fee brothers orange bitters": "Orange Bitters",
    "mole bitters": "Mole Bitters",
    "chocolate mole bitters": "Mole Bitters",
    # Vermouth
    "dry vermouth": "Dry Vermouth",
    "french dry vermouth": "Dry Vermouth",
    "sweet vermouth": "Sweet Vermouth",
    "italian sweet vermouth": "Sweet Vermouth",
    "bianco vermouth": "Bianco Vermouth",
    "blanc vermouth": "Bianco Vermouth",
    # Whiskey/Bourbon
    "bourbon whiskey": "Bourbon",
    "bourbon whisky": "Bourbon",
    "rye whiskey": "Rye Whiskey",
    "rye whisky": "Rye Whiskey",
    "scotch whisky": "Scotch Whisky",
    "blended scotch whisky": "Scotch Whisky",
    "irish whiskey": "Irish Whiskey",
    # Rum
    "white rum": "White Rum",
    "light rum": "White Rum",
    "silver rum": "White Rum",
    "dark rum": "Dark Rum",
    "aged rum": "Aged Rum",
    "jamaican rum": "Jamaican Rum",
    "gold rum": "Gold Rum",
    # Gin
    "london dry gin": "London Dry Gin",
    "dry gin": "London Dry Gin",
    # Tequila
    "blanco tequila": "Tequila Blanco",
    "silver tequila": "Tequila Blanco",
    "reposado tequila": "Tequila Reposado",
    "anejo tequila": "Tequila Anejo",
    # Other spirits
    "triple sec": "Triple Sec",
    "cointreau": "Cointreau",
    "grand marnier": "Grand Marnier",
    "blue curacao": "Blue Curacao",
    # Sodas
    "club soda": "Club Soda",
    "carbonated water": "Club Soda",
    "sparkling water": "Club Soda",
    "soda water": "Club Soda",
    "tonic water": "Tonic Water",
    "ginger ale": "Ginger Ale",
    "ginger beer": "Ginger Beer",
    # Eggs / dairy
    "egg white": "Egg White",
    "egg whites": "Egg White",
    "heavy cream": "Heavy Cream",
    "heavy whipping cream": "Heavy Cream",
    "whole milk": "Milk",
    # Misc
    "grenadine syrup": "Grenadine",
    "maraschino liqueur": "Maraschino Liqueur",
    "luxardo maraschino liqueur": "Maraschino Liqueur",
    "falernum": "Falernum",
    "orgeat syrup": "Orgeat",
    "orgeat (almond syrup)": "Orgeat",
    "absinthe": "Absinthe",
    "pastis": "Pastis",
    "campari": "Campari",
    "aperol": "Aperol",
    "kahlua": "Kahlua",
    "baileys irish cream": "Baileys Irish Cream",
    "blue curacao liqueur": "Blue Curacao",
}


def normalize_ingredient(name: str) -> str:
    """Apply normalization map, then strip and title-case the result."""
    cleaned = name.strip().lower()
    # Remove trailing parenthetical notes like "(optional)"
    if "(" in cleaned:
        base = cleaned[: cleaned.index("(")].strip()
    else:
        base = cleaned

    if base in NORMALIZATION_MAP:
        return NORMALIZATION_MAP[base]
    if cleaned in NORMALIZATION_MAP:
        return NORMALIZATION_MAP[cleaned]

    # Title-case as fallback
    return base.title()


def match_to_db(db: Session, normalized_name: str):
    """
    Try to match a normalized ingredient name to a DB Ingredient record.
    Returns the Ingredient or None.
    """
    # Import here to avoid circular deps at module level
    from backend.app.models.ingredient import Ingredient  # type: ignore

    # 1. Exact match
    ing = db.query(Ingredient).filter(Ingredient.name == normalized_name).first()
    if ing:
        return ing

    # 2. Case-insensitive match
    ing = (
        db.query(Ingredient)
        .filter(Ingredient.name.ilike(normalized_name))
        .first()
    )
    if ing:
        return ing

    # 3. Partial LIKE match (ingredient name contains the search term)
    ing = (
        db.query(Ingredient)
        .filter(Ingredient.name.ilike(f"%{normalized_name}%"))
        .first()
    )
    return ing


def log_unmatched(name: str, cocktail: str) -> None:
    """Append an unmatched ingredient entry to unmatched.log."""
    try:
        with open(UNMATCHED_LOG, "a", encoding="utf-8") as f:
            f.write(f"{cocktail}\t{name}\n")
    except OSError as e:
        logger.warning(f"Could not write to unmatched log: {e}")
