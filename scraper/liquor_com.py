import json
import logging
import re
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

from scraper.base import BaseScraper
from scraper.config import LIQUOR_COM_BASE_URL, MAX_RETRIES
from scraper.models import ScrapedCocktail, ScrapedIngredient

logger = logging.getLogger(__name__)

COCKTAIL_URL_PATTERN = re.compile(r"/recipes/[a-z0-9-]+/?$")


class LiquorComScraper(BaseScraper):
    """Scraper for liquor.com cocktail recipes."""

    source_site = "liquor.com"

    # ------------------------------------------------------------------
    # URL discovery
    # ------------------------------------------------------------------

    async def get_cocktail_urls(self, limit: int | None = None) -> list[str]:
        """Collect cocktail recipe URLs from the liquor.com sitemap."""
        urls: list[str] = []

        # Try XML sitemap index first
        sitemap_urls = [
            f"{LIQUOR_COM_BASE_URL}/sitemap.xml",
            f"{LIQUOR_COM_BASE_URL}/sitemap_index.xml",
        ]

        for sitemap_url in sitemap_urls:
            try:
                found = await self._urls_from_sitemap(sitemap_url)
                if found:
                    urls = found
                    break
            except Exception as e:
                logger.warning(f"Sitemap {sitemap_url} failed: {e}")

        # Fallback: crawl the main recipes listing page
        if not urls:
            try:
                urls = await self._urls_from_listing()
            except Exception as e:
                logger.warning(f"Listing page fallback failed: {e}")

        # Deduplicate while preserving order
        seen: set[str] = set()
        deduped: list[str] = []
        for u in urls:
            if u not in seen:
                seen.add(u)
                deduped.append(u)

        if limit is not None:
            deduped = deduped[:limit]

        logger.info(f"[liquor.com] Found {len(deduped)} cocktail URLs")
        return deduped

    async def _urls_from_sitemap(self, sitemap_url: str) -> list[str]:
        """Parse a sitemap XML (or sitemap index) and extract recipe URLs."""
        urls: list[str] = []
        for attempt in range(MAX_RETRIES):
            try:
                resp = await self.client.get(sitemap_url)
                resp.raise_for_status()
                break
            except Exception as e:
                if attempt == MAX_RETRIES - 1:
                    raise
                logger.debug(f"Sitemap attempt {attempt+1} failed: {e}")
        else:
            return urls

        soup = BeautifulSoup(resp.text, "lxml-xml")

        # Sitemap index - recurse into child sitemaps
        sitemaploc_tags = soup.find_all("sitemap")
        if sitemaploc_tags:
            for sm in sitemaploc_tags:
                loc = sm.find("loc")
                if loc and loc.text:
                    child_url = loc.text.strip()
                    if "recipe" in child_url or "cocktail" in child_url:
                        try:
                            urls.extend(await self._urls_from_sitemap(child_url))
                        except Exception as e:
                            logger.debug(f"Child sitemap {child_url} failed: {e}")
            return urls

        # Regular sitemap - look for recipe URLs
        for loc in soup.find_all("loc"):
            url = loc.text.strip()
            parsed = urlparse(url)
            if COCKTAIL_URL_PATTERN.search(parsed.path):
                urls.append(url)

        return urls

    async def _urls_from_listing(self) -> list[str]:
        """Crawl the main cocktail listing page for recipe links."""
        urls: list[str] = []
        listing_url = f"{LIQUOR_COM_BASE_URL}/cocktails"
        page = 1

        while True:
            paginated = listing_url if page == 1 else f"{listing_url}?page={page}"
            try:
                resp = await self.client.get(paginated)
                resp.raise_for_status()
            except Exception as e:
                logger.warning(f"Listing page {paginated} failed: {e}")
                break

            soup = BeautifulSoup(resp.text, "lxml")
            links = soup.find_all("a", href=COCKTAIL_URL_PATTERN)
            if not links:
                break

            for link in links:
                href = link.get("href", "")
                full_url = urljoin(LIQUOR_COM_BASE_URL, href)
                urls.append(full_url)

            # Check for a "next page" link
            next_link = soup.find("a", {"rel": "next"}) or soup.find(
                "a", string=re.compile(r"next", re.I)
            )
            if not next_link:
                break
            page += 1

        return urls

    # ------------------------------------------------------------------
    # Parsing individual cocktail pages
    # ------------------------------------------------------------------

    async def parse_cocktail(self, url: str) -> ScrapedCocktail | None:
        """Fetch and parse a single cocktail page."""
        for attempt in range(MAX_RETRIES):
            try:
                resp = await self.client.get(url)
                resp.raise_for_status()
                break
            except Exception as e:
                if attempt == MAX_RETRIES - 1:
                    logger.warning(f"Could not fetch {url} after {MAX_RETRIES} attempts: {e}")
                    return None
                logger.debug(f"Attempt {attempt+1} for {url} failed: {e}")

        soup = BeautifulSoup(resp.text, "lxml")

        # Try JSON-LD first
        cocktail = self._parse_json_ld(soup, url)
        if cocktail:
            return cocktail

        # Fallback to HTML parsing
        return self._parse_html(soup, url)

    def _parse_json_ld(self, soup: BeautifulSoup, url: str) -> ScrapedCocktail | None:
        """Extract cocktail data from JSON-LD Recipe schema."""
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(script.string or "")
            except (json.JSONDecodeError, TypeError):
                continue

            # Handle @graph arrays
            if isinstance(data, list):
                recipes = [d for d in data if d.get("@type") == "Recipe"]
            elif isinstance(data, dict):
                if data.get("@type") == "Recipe":
                    recipes = [data]
                elif "@graph" in data:
                    recipes = [
                        d for d in data["@graph"] if d.get("@type") == "Recipe"
                    ]
                else:
                    recipes = []
            else:
                recipes = []

            for recipe in recipes:
                try:
                    return self._recipe_schema_to_cocktail(recipe, url)
                except Exception as e:
                    logger.debug(f"JSON-LD parse error for {url}: {e}")

        return None

    def _recipe_schema_to_cocktail(
        self, recipe: dict, url: str
    ) -> ScrapedCocktail | None:
        """Convert a Recipe schema dict to ScrapedCocktail."""
        name = recipe.get("name", "").strip()
        if not name:
            return None

        description = recipe.get("description", "").strip() or None

        # Instructions
        raw_instructions = recipe.get("recipeInstructions", [])
        instructions_parts: list[str] = []
        if isinstance(raw_instructions, str):
            instructions_parts.append(raw_instructions.strip())
        elif isinstance(raw_instructions, list):
            for step in raw_instructions:
                if isinstance(step, str):
                    instructions_parts.append(step.strip())
                elif isinstance(step, dict):
                    text = step.get("text", step.get("name", "")).strip()
                    if text:
                        instructions_parts.append(text)
        instructions = "\n".join(instructions_parts) or None

        # Ingredients
        ingredients: list[ScrapedIngredient] = []
        for raw in recipe.get("recipeIngredient", []):
            ing = self._parse_ingredient_string(str(raw))
            if ing:
                ingredients.append(ing)

        # Image
        image = recipe.get("image")
        image_url: str | None = None
        if isinstance(image, str):
            image_url = image
        elif isinstance(image, list) and image:
            image_url = image[0] if isinstance(image[0], str) else image[0].get("url")
        elif isinstance(image, dict):
            image_url = image.get("url")

        # Category / glass - these often live in the HTML, not JSON-LD
        category = recipe.get("recipeCategory") or None
        if isinstance(category, list):
            category = category[0] if category else None

        return ScrapedCocktail(
            name=name,
            description=description,
            instructions=instructions,
            ingredients=ingredients,
            source_url=url,
            source_site=self.source_site,
            category=category,
            image_url=image_url,
        )

    def _parse_html(self, soup: BeautifulSoup, url: str) -> ScrapedCocktail | None:
        """Fallback: parse cocktail data directly from HTML."""
        try:
            # Name
            name_tag = (
                soup.find("h1")
                or soup.find(class_=re.compile(r"recipe[-_]?title|heading", re.I))
            )
            name = name_tag.get_text(strip=True) if name_tag else ""
            if not name:
                return None

            # Description
            desc_tag = soup.find(
                class_=re.compile(r"recipe[-_]?desc|summary|intro", re.I)
            )
            description = desc_tag.get_text(strip=True) if desc_tag else None

            # Ingredients
            ingredients: list[ScrapedIngredient] = []
            ing_container = soup.find(
                class_=re.compile(r"ingredient", re.I)
            ) or soup.find("ul", class_=re.compile(r"ingredient", re.I))
            if ing_container:
                for li in ing_container.find_all("li"):
                    text = li.get_text(strip=True)
                    ing = self._parse_ingredient_string(text)
                    if ing:
                        ingredients.append(ing)

            # Instructions
            instr_parts: list[str] = []
            instr_container = soup.find(
                class_=re.compile(r"instruction|direction|method|step", re.I)
            )
            if instr_container:
                for step in instr_container.find_all(["li", "p"]):
                    text = step.get_text(strip=True)
                    if text:
                        instr_parts.append(text)
            instructions = "\n".join(instr_parts) or None

            # Image
            og_image = soup.find("meta", property="og:image")
            image_url = og_image.get("content") if og_image else None

            # Glass type - often in a details/info section
            glass_type: str | None = None
            glass_tag = soup.find(string=re.compile(r"glass", re.I))
            if glass_tag and glass_tag.parent:
                sibling = glass_tag.parent.find_next_sibling()
                if sibling:
                    glass_type = sibling.get_text(strip=True) or None

            return ScrapedCocktail(
                name=name,
                description=description,
                instructions=instructions,
                ingredients=ingredients,
                source_url=url,
                source_site=self.source_site,
                glass_type=glass_type,
                image_url=image_url,
            )
        except Exception as e:
            logger.warning(f"HTML parse error for {url}: {e}")
            return None

    # ------------------------------------------------------------------
    # Ingredient string parsing
    # ------------------------------------------------------------------

    _AMOUNT_UNIT_PATTERN = re.compile(
        r"^(?P<amount>[\d\s/\u00bc-\u00be\u2150-\u215e.,-]+)?"
        r"\s*(?P<unit>oz|ounce|ounces|ml|cl|dash|dashes|tsp|tbsp|"
        r"teaspoon|tablespoon|cup|cups|part|parts|splash|splashes|"
        r"bsp|drop|drops|pinch|slice|slices|wedge|wedges|sprig|sprigs|"
        r"bar spoon|barspoon)s?\b"
        r"\s*(?P<name>.+)$",
        re.IGNORECASE,
    )

    def _parse_ingredient_string(self, raw: str) -> ScrapedIngredient | None:
        """Parse a raw ingredient string into amount / unit / name."""
        raw = raw.strip()
        if not raw:
            return None

        is_optional = bool(re.search(r"\boptional\b", raw, re.I))
        raw_clean = re.sub(r"\(optional\)", "", raw, flags=re.I).strip()

        m = self._AMOUNT_UNIT_PATTERN.match(raw_clean)
        if m:
            amount = (m.group("amount") or "").strip() or None
            unit = (m.group("unit") or "").strip() or None
            name = (m.group("name") or "").strip()
        else:
            # Try to split leading number from the rest
            parts = raw_clean.split(None, 1)
            if parts and re.match(r"^[\d/\u00bc-\u00be]+$", parts[0]):
                amount = parts[0]
                name = parts[1] if len(parts) > 1 else raw_clean
                unit = None
            else:
                amount = None
                unit = None
                name = raw_clean

        name = name.strip(" ,;")
        if not name:
            return None

        return ScrapedIngredient(
            name=name,
            amount=amount,
            unit=unit,
            is_optional=is_optional,
        )
