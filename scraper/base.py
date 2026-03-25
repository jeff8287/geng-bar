import asyncio
import logging
from abc import ABC, abstractmethod

import httpx

from scraper.config import RATE_LIMIT_SECONDS, USER_AGENT
from scraper.models import ScrapedCocktail

logger = logging.getLogger(__name__)


class BaseScraper(ABC):
    def __init__(self, rate_limit: float = RATE_LIMIT_SECONDS):
        self.rate_limit = rate_limit
        self.client = httpx.AsyncClient(
            headers={"User-Agent": USER_AGENT},
            timeout=30.0,
            follow_redirects=True,
        )

    @abstractmethod
    async def get_cocktail_urls(self, limit: int | None = None) -> list[str]:
        ...

    @abstractmethod
    async def parse_cocktail(self, url: str) -> ScrapedCocktail | None:
        ...

    async def run(self, limit: int | None = None) -> list[ScrapedCocktail]:
        urls = await self.get_cocktail_urls(limit=limit)
        results = []
        for url in urls:
            await asyncio.sleep(self.rate_limit)
            try:
                cocktail = await self.parse_cocktail(url)
                if cocktail:
                    results.append(cocktail)
            except Exception as e:
                logger.warning(f"Failed: {url}: {e}")
        return results

    async def close(self):
        await self.client.aclose()
