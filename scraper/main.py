"""
CLI entrypoint for the Home Cocktail Bar scraper.

Usage:
    python -m scraper.main --source liquor_com --limit 50
    python -m scraper.main --source diffords --limit 50
    python -m scraper.main --source all --limit 100
"""

import argparse
import asyncio
import logging
import sys
from pathlib import Path

# Allow running from the project root without installing the package
sys.path.insert(0, str(Path(__file__).parent.parent))
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Scrape cocktail recipes into the Home Cocktail Bar database."
    )
    parser.add_argument(
        "--source",
        choices=["liquor_com", "diffords", "all"],
        default="all",
        help="Which source(s) to scrape (default: all)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Maximum number of cocktails to scrape per source (default: no limit)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Scrape but do not write to the database",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Logging verbosity (default: INFO)",
    )
    return parser


async def run_scraper(source: str, limit: int | None, dry_run: bool) -> None:
    from scraper.diffords import DiffordsScraper
    from scraper.liquor_com import LiquorComScraper
    from scraper.storage import store_cocktails

    scrapers = []
    if source in ("liquor_com", "all"):
        scrapers.append(LiquorComScraper())
    if source in ("diffords", "all"):
        scrapers.append(DiffordsScraper())

    # Build DB session only when not in dry-run mode
    db = None
    if not dry_run:
        try:
            from app.database import SessionLocal  # type: ignore
        except ImportError:
            from backend.app.database import SessionLocal  # type: ignore
        db = SessionLocal()

    total_scraped = 0
    total_new = 0
    total_updated = 0
    total_duplicate = 0
    total_unmatched = 0

    for scraper in scrapers:
        site = scraper.source_site
        logger.info(f"Starting scraper: {site} (limit={limit})")
        try:
            cocktails = await scraper.run(limit=limit)
            total_scraped += len(cocktails)
            logger.info(f"[{site}] Scraped {len(cocktails)} cocktails")

            if not dry_run and db is not None:
                summary = store_cocktails(db, cocktails)
                total_new += summary["new"]
                total_updated += summary["updated"]
                total_duplicate += summary["duplicate"]
                total_unmatched += summary["unmatched_ingredients"]
                logger.info(
                    f"[{site}] Stored: {summary['new']} new, "
                    f"{summary['updated']} updated, "
                    f"{summary['duplicate']} duplicates, "
                    f"{summary['unmatched_ingredients']} unmatched ingredients"
                )
            else:
                for c in cocktails:
                    logger.info(f"  [DRY RUN] {c.name} ({len(c.ingredients)} ingredients)")
        except Exception as e:
            logger.error(f"Scraper {site} failed: {e}")
        finally:
            await scraper.close()

    if db is not None:
        db.close()

    print("\n" + "=" * 50)
    print("SCRAPE SUMMARY")
    print("=" * 50)
    print(f"  Total scraped   : {total_scraped}")
    if not dry_run:
        print(f"  New             : {total_new}")
        print(f"  Updated         : {total_updated}")
        print(f"  Duplicates      : {total_duplicate}")
        print(f"  Unmatched ings  : {total_unmatched}")
    else:
        print("  (dry run - no DB writes)")
    print("=" * 50)


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    logging.getLogger().setLevel(getattr(logging, args.log_level))

    asyncio.run(run_scraper(args.source, args.limit, args.dry_run))


if __name__ == "__main__":
    main()
