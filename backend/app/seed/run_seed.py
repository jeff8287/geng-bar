"""
CLI entry point for seeding the database.

Usage:
    cd backend && python -m app.seed.run_seed
"""
from __future__ import annotations

import sys
from pathlib import Path

# Resolve data file paths relative to this script's location:
#   backend/app/seed/run_seed.py  ->  ../../..  -> project root
_SEED_DIR = Path(__file__).parent
_BACKEND_DIR = _SEED_DIR.parent.parent          # backend/
_PROJECT_ROOT = _BACKEND_DIR.parent             # cocktail/

# In Docker, data files are mounted at /data/; locally, they're at project root
_DATA_DIR = Path("/data")
if _DATA_DIR.exists():
    STOCK_YAML = _DATA_DIR / "stock.yaml"
    MENU_MD = _DATA_DIR / "menu-all.md"
    RECIPE_MD = _DATA_DIR / "recipe.md"
else:
    STOCK_YAML = _PROJECT_ROOT / "stock.yaml"
    MENU_MD = _PROJECT_ROOT / "menu-all.md"
    RECIPE_MD = _PROJECT_ROOT / "recipe.md"


def main() -> None:
    from app.database import SessionLocal
    # Import models so SQLAlchemy registers them before any session use
    import app.models  # noqa: F401
    from app.seed.seed_stock import seed_stock
    from app.seed.seed_menu import seed_menu
    from app.seed.seed_recipes import seed_recipes

    print("Starting database seed...")

    # --- seed_stock ---
    db = SessionLocal()
    try:
        print(f"  Seeding stock from {STOCK_YAML} ...")
        stock_count = seed_stock(db, str(STOCK_YAML))
        print(f"  Seeded {stock_count} ingredients.")
    except Exception as exc:
        db.rollback()
        print(f"  ERROR seeding stock: {exc}", file=sys.stderr)
        db.close()
        sys.exit(1)
    finally:
        db.close()

    # --- seed_menu ---
    db = SessionLocal()
    try:
        print(f"  Seeding menu from {MENU_MD} ...")
        menu_count = seed_menu(db, str(MENU_MD))
        print(f"  Seeded {menu_count} cocktails.")
    except Exception as exc:
        db.rollback()
        print(f"  ERROR seeding menu: {exc}", file=sys.stderr)
        db.close()
        sys.exit(1)
    finally:
        db.close()

    # --- seed_recipes ---
    db = SessionLocal()
    try:
        print(f"  Seeding recipes from {RECIPE_MD} ...")
        recipe_count = seed_recipes(db, str(RECIPE_MD))
        print(f"  Updated {recipe_count} cocktails with exact recipe amounts.")
    except Exception as exc:
        db.rollback()
        print(f"  ERROR seeding recipes: {exc}", file=sys.stderr)
        db.close()
        sys.exit(1)
    finally:
        db.close()

    print("\nSeed complete.")
    print(f"  Ingredients : {stock_count}")
    print(f"  Cocktails   : {menu_count}")
    print(f"  Recipes     : {recipe_count}")


if __name__ == "__main__":
    main()
