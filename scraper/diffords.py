import json
import logging
import re
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from scraper.base import BaseScraper
from scraper.config import DIFFORDS_BASE_URL, MAX_RETRIES
from scraper.models import ScrapedCocktail, ScrapedIngredient

logger = logging.getLogger(__name__)

COCKTAIL_PATH_PATTERN = re.compile(r"/cocktails/[a-z0-9-]+/?$")


class DiffordsScraper(BaseScraper):
    """Scraper for diffordsguide.com cocktail recipes."""

    source_site = "diffordsguide.com"

    def __init__(self):
        # Use a more conservative rate limit for Difford's
        super().__init__(rate_limit=3.0)

    # ------------------------------------------------------------------
    # URL discovery
    # ------------------------------------------------------------------

    async def get_cocktail_urls(self, limit: int | None = None) -> list[str]:
        """Collect cocktail URLs from Difford's Guide listing pages."""
        urls: list[str] = []

        # Try sitemap first
        try:
            sitemap_urls = await self._urls_from_sitemap()
            if sitemap_urls:
                urls = sitemap_urls
        except Exception as e:
            logger.warning(f"Sitemap discovery failed: {e}")

        # Fallback to listing pages
        if not urls:
            try:
                urls = await self._urls_from_listing()
            except Exception as e:
                logger.warning(f"Listing page discovery failed: {e}")

        # Deduplicate
        seen: set[str] = set()
        deduped: list[str] = []
        for u in urls:
            if u not in seen:
                seen.add(u)
                deduped.append(u)

        if limit is not None:
            deduped = deduped[:limit]

        logger.info(f"[diffordsguide.com] Found {len(deduped)} cocktail URLs")
        return deduped

    async def _urls_from_sitemap(self) -> list[str]:
        """Try to extract cocktail URLs from Difford's sitemap."""
        urls: list[str] = []
        candidates = [
            f"{DIFFORDS_BASE_URL}/sitemap.xml",
            f"{DIFFORDS_BASE_URL}/sitemap_index.xml",
        ]
        for sitemap_url in candidates:
            try:
                resp = await self.client.get(sitemap_url)
                resp.raise_for_status()
            except Exception:
                continue

            soup = BeautifulSoup(resp.text, "lxml-xml")

            # Sitemap index - look for cocktail child sitemaps
            for sm in soup.find_all("sitemap"):
                loc = sm.find("loc")
                if loc and loc.text and "cocktail" in loc.text:
                    try:
                        child_resp = await self.client.get(loc.text.strip())
                        child_resp.raise_for_status()
                        child_soup = BeautifulSoup(child_resp.text, "lxml-xml")
                        for loc_tag in child_soup.find_all("loc"):
                            url = loc_tag.text.strip()
                            if COCKTAIL_PATH_PATTERN.search(url):
                                urls.append(url)
                    except Exception as e:
                        logger.debug(f"Child sitemap failed: {e}")

            # Regular sitemap
            if not urls:
                for loc_tag in soup.find_all("loc"):
                    url = loc_tag.text.strip()
                    if COCKTAIL_PATH_PATTERN.search(url):
                        urls.append(url)

            if urls:
                break

        return urls

    async def _urls_from_listing(self) -> list[str]:
        """Crawl Difford's cocktail listing pages for recipe links."""
        urls: list[str] = []
        base_listing = f"{DIFFORDS_BASE_URL}/cocktails"
        page = 1

        while True:
            paginated = (
                base_listing if page == 1 else f"{base_listing}?page={page}"
            )
            try:
                resp = await self.client.get(paginated)
                resp.raise_for_status()
            except Exception as e:
                logger.warning(f"Listing page {paginated} failed: {e}")
                break

            soup = BeautifulSoup(resp.text, "lxml")
            found_on_page = 0
            for a in soup.find_all("a", href=True):
                href = a["href"]
                if COCKTAIL_PATH_PATTERN.search(href):
                    full_url = urljoin(DIFFORDS_BASE_URL, href)
                    urls.append(full_url)
                    found_on_page += 1

            if found_on_page == 0:
                break

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
        """Fetch and parse a single Difford's Guide cocktail page."""
        for attempt in range(MAX_RETRIES):
            try:
                resp = await self.client.get(url)
                resp.raise_for_status()
                break
            except Exception as e:
                if attempt == MAX_RETRIES - 1:
                    logger.warning(
                        f"Could not fetch {url} after {MAX_RETRIES} attempts: {e}"
                    )
                    return None
                logger.debug(f"Attempt {attempt+1} for {url} failed: {e}")

        soup = BeautifulSoup(resp.text, "lxml")

        # Try JSON-LD first
        cocktail = self._parse_json_ld(soup, url)
        if cocktail:
            return cocktail

        # Fallback to HTML
        return self._parse_html(soup, url)

    def _parse_json_ld(self, soup: BeautifulSoup, url: str) -> ScrapedCocktail | None:
        """Extract data from JSON-LD Recipe schema."""
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(script.string or "")
            except (json.JSONDecodeError, TypeError):
                continue

            recipes: list[dict] = []
            if isinstance(data, list):
                recipes = [d for d in data if isinstance(d, dict) and d.get("@type") == "Recipe"]
            elif isinstance(data, dict):
                if data.get("@type") == "Recipe":
                    recipes = [data]
                elif "@graph" in data:
                    recipes = [
                        d for d in data["@graph"]
                        if isinstance(d, dict) and d.get("@type") == "Recipe"
                    ]

            for recipe in recipes:
                try:
                    return self._recipe_to_cocktail(recipe, url)
                except Exception as e:
                    logger.debug(f"JSON-LD parse error at {url}: {e}")

        return None

    def _recipe_to_cocktail(self, recipe: dict, url: str) -> ScrapedCocktail | None:
        """Convert a Recipe schema dict to ScrapedCocktail."""
        name = recipe.get("name", "").strip()
        if not name:
            return None

        description = recipe.get("description", "").strip() or None

        # Instructions
        raw_instructions = recipe.get("recipeInstructions", [])
        parts: list[str] = []
        if isinstance(raw_instructions, str):
            parts.append(raw_instructions.strip())
        elif isinstance(raw_instructions, list):
            for step in raw_instructions:
                if isinstance(step, str):
                    parts.append(step.strip())
                elif isinstance(step, dict):
                    text = step.get("text", step.get("name", "")).strip()
                    if text:
                        parts.append(text)
        instructions = "\n".join(parts) or None

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
        """Fallback HTML parser for Difford's Guide cocktail pages."""
        try:
            # Name
            name_tag = soup.find("h1") or soup.find(
                class_=re.compile(r"cocktail[-_]?name|recipe[-_]?title", re.I)
            )
            name = name_tag.get_text(strip=True) if name_tag else ""
            if not name:
                return None

            # Description
            desc_tag = soup.find(
                class_=re.compile(r"desc|intro|summary|about", re.I)
            )
            description = desc_tag.get_text(strip=True) if desc_tag else None

            # Ingredients - Difford's typically uses a structured table
            ingredients: list[ScrapedIngredient] = []
            ing_table = soup.find(
                "table", class_=re.compile(r"ingredient", re.I)
            ) or soup.find("ul", class_=re.compile(r"ingredient", re.I))

            if ing_table:
                rows = ing_table.find_all("tr") or ing_table.find_all("li")
                for row in rows:
                    cells = row.find_all("td")
                    if len(cells) >= 2:
                        # Table format: amount | unit | name
                        amount = cells[0].get_text(strip=True) or None
                        if len(cells) >= 3:
                            unit = cells[1].get_text(strip=True) or None
                            name_text = cells[2].get_text(strip=True)
                        else:
                            unit = None
                            name_text = cells[1].get_text(strip=True)

                        if name_text:
                            ingredients.append(
                                ScrapedIngredient(
                                    name=name_text,
                                    amount=amount,
                                    unit=unit,
                                )
                            )
                    else:
                        text = row.get_text(strip=True)
                        ing = self._parse_ingredient_string(text)
                        if ing:
                            ingredients.append(ing)
            else:
                # Generic ingredient list
                for li in soup.find_all("li"):
                    text = li.get_text(strip=True)
                    if text and len(text) < 200:
                        ing = self._parse_ingredient_string(text)
                        if ing:
                            ingredients.append(ing)

            # Method / instructions
            method_tag = soup.find(
                class_=re.compile(r"method|instruction|direction|how[-_]?to", re.I)
            )
            instructions: str | None = None
            if method_tag:
                parts = [p.get_text(strip=True) for p in method_tag.find_all(["p", "li"])]
                instructions = "\n".join(p for p in parts if p) or None

            # Glass type
            glass_type: str | None = None
            glass_label = soup.find(string=re.compile(r"\bglass\b", re.I))
            if glass_label and glass_label.parent:
                sibling = glass_label.parent.find_next_sibling()
                if sibling:
                    glass_type = sibling.get_text(strip=True) or None

            # Garnish
            garnish: str | None = None
            garnish_label = soup.find(string=re.compile(r"\bgarnish\b", re.I))
            if garnish_label and garnish_label.parent:
                sibling = garnish_label.parent.find_next_sibling()
                if sibling:
                    garnish = sibling.get_text(strip=True) or None

            # Image
            og_image = soup.find("meta", property="og:image")
            image_url = og_image.get("content") if og_image else None

            return ScrapedCocktail(
                name=name,
                description=description,
                instructions=instructions,
                ingredients=ingredients,
                source_url=url,
                source_site=self.source_site,
                glass_type=glass_type,
                garnish=garnish,
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
