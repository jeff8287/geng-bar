from pydantic import BaseModel


class ScrapedIngredient(BaseModel):
    name: str
    amount: str | None = None
    unit: str | None = None
    is_optional: bool = False


class ScrapedCocktail(BaseModel):
    name: str
    description: str | None = None
    instructions: str | None = None
    ingredients: list[ScrapedIngredient] = []
    source_url: str | None = None
    source_site: str | None = None
    category: str | None = None
    glass_type: str | None = None
    garnish: str | None = None
    image_url: str | None = None
