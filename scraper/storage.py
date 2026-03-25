import logging
import re
from pathlib import Path

import httpx
from sqlalchemy.orm import Session

from scraper.models import ScrapedCocktail
from scraper.normalizer import log_unmatched, match_to_db, normalize_ingredient

logger = logging.getLogger(__name__)

MEDIA_DIR = Path(__file__).parent.parent / "backend" / "media" / "cocktails"

# Simple flavor keywords used to estimate flavor_profile
_FLAVOR_KEYWORDS: dict[str, list[str]] = {
    "sweet": ["simple syrup", "grenadine", "orgeat", "triple sec", "cointreau",
               "liqueur", "cream", "honey", "agave", "falernum"],
    "sour": ["lemon juice", "lime juice", "citric", "sour"],
    "bitter": ["campari", "aperol", "bitters", "angostura", "cynar", "amaro"],
    "spirit_forward": ["whiskey", "bourbon", "rye", "scotch", "gin", "rum",
                       "tequila", "mezcal", "vodka", "brandy", "cognac"],
    "refreshing": ["mint", "cucumber", "soda", "tonic", "ginger beer",
                   "ginger ale", "club soda"],
    "creamy": ["cream", "milk", "egg", "baileys", "coconut cream"],
    "smoky": ["mezcal", "scotch", "peated", "lapsang"],
    "herbal": ["gin", "absinthe", "chartreuse", "benedictine", "amaro", "vermouth"],
}


def _estimate_flavor_profile(cocktail: ScrapedCocktail) -> dict:
    """Return a simple flavor profile dict based on ingredient names."""
    profile: dict[str, bool] = {}
    all_names = " ".join(
        ing.name.lower() for ing in cocktail.ingredients
    )
    for flavor, keywords in _FLAVOR_KEYWORDS.items():
        profile[flavor] = any(kw in all_names for kw in keywords)
    return profile


def _slug(name: str) -> str:
    """Convert a cocktail name to a filesystem-safe slug."""
    slug = name.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")


async def download_image(
    client: httpx.AsyncClient, image_url: str, slug: str
) -> str | None:
    """Download an image to media/cocktails/{slug}.jpg and return the local path."""
    if not image_url:
        return None

    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    ext = "jpg"
    # Preserve extension if present
    if "." in image_url.split("?")[0].split("/")[-1]:
        raw_ext = image_url.split("?")[0].rsplit(".", 1)[-1].lower()
        if raw_ext in ("jpg", "jpeg", "png", "webp", "gif"):
            ext = raw_ext if raw_ext != "jpeg" else "jpg"

    dest = MEDIA_DIR / f"{slug}.{ext}"
    try:
        resp = await client.get(image_url, timeout=20.0)
        resp.raise_for_status()
        dest.write_bytes(resp.content)
        return str(dest)
    except Exception as e:
        logger.warning(f"Could not download image {image_url}: {e}")
        return None


def store_cocktails(
    db: Session,
    cocktails: list[ScrapedCocktail],
    *,
    download_images: bool = False,
    http_client=None,
) -> dict:
    """
    Insert or update cocktails in the database.

    Returns a summary dict with keys: new, updated, duplicate, unmatched_ingredients.
    """
    # Import models here to keep scraper importable without the backend on sys.path
    try:
        from backend.app.models.cocktail import Cocktail, CocktailIngredient  # type: ignore
        from backend.app.models.ingredient import Ingredient, IngredientStatus  # type: ignore
    except ImportError:
        from app.models.cocktail import Cocktail, CocktailIngredient  # type: ignore
        from app.models.ingredient import Ingredient, IngredientStatus  # type: ignore

    summary = {"new": 0, "updated": 0, "duplicate": 0, "unmatched_ingredients": 0}

    for scraped in cocktails:
        try:
            existing = (
                db.query(Cocktail).filter(Cocktail.name == scraped.name).first()
            )

            if existing:
                # Update only fields that are currently None/empty
                changed = False
                for field in (
                    "description", "instructions", "source_url", "source_site",
                    "category", "glass_type", "garnish", "image_url",
                ):
                    current_val = getattr(existing, field, None)
                    new_val = getattr(scraped, field, None)
                    if not current_val and new_val:
                        setattr(existing, field, new_val)
                        changed = True

                if existing.flavor_profile is None:
                    existing.flavor_profile = _estimate_flavor_profile(scraped)
                    changed = True

                if changed:
                    db.commit()
                    summary["updated"] += 1
                else:
                    summary["duplicate"] += 1
                continue

            # --- New cocktail ---
            db_cocktail = Cocktail(
                name=scraped.name,
                description=scraped.description,
                instructions=scraped.instructions,
                source_url=scraped.source_url,
                source_site=scraped.source_site,
                category=scraped.category,
                glass_type=scraped.glass_type,
                garnish=scraped.garnish,
                image_url=scraped.image_url,
                flavor_profile=_estimate_flavor_profile(scraped),
            )
            db.add(db_cocktail)
            db.flush()  # get db_cocktail.id

            # Resolve ingredients
            for scraped_ing in scraped.ingredients:
                normalized = normalize_ingredient(scraped_ing.name)
                db_ing = match_to_db(db, normalized)

                if db_ing is None:
                    # Create a new ingredient record
                    db_ing = Ingredient(
                        name=normalized,
                        category="Other",
                        status=IngredientStatus.IN_STOCK,
                    )
                    db.add(db_ing)
                    db.flush()
                    log_unmatched(scraped_ing.name, scraped.name)
                    summary["unmatched_ingredients"] += 1

                link = CocktailIngredient(
                    cocktail_id=db_cocktail.id,
                    ingredient_id=db_ing.id,
                    amount=scraped_ing.amount,
                    unit=scraped_ing.unit,
                    is_optional=scraped_ing.is_optional,
                )
                db.add(link)

            db.commit()
            summary["new"] += 1

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to store cocktail '{scraped.name}': {e}")

    return summary
