from datetime import datetime

from sqlalchemy import String, Text, DateTime, Float, JSON, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Cocktail(Base):
    __tablename__ = "cocktails"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_site: Mapped[str | None] = mapped_column(String(100), nullable=True)
    category: Mapped[str | None] = mapped_column(String(50), index=True, nullable=True)
    glass_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    garnish: Mapped[str | None] = mapped_column(String(200), nullable=True)
    difficulty: Mapped[str | None] = mapped_column(String(50), nullable=True)
    alcohol_level: Mapped[float | None] = mapped_column(Float, nullable=True)
    flavor_profile: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    image_local_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    ingredient_links: Mapped[list["CocktailIngredient"]] = relationship(
        back_populates="cocktail", cascade="all, delete-orphan"
    )
    reviews: Mapped[list["Review"]] = relationship(
        back_populates="cocktail", cascade="all, delete-orphan"
    )


class CocktailIngredient(Base):
    __tablename__ = "cocktail_ingredients"

    cocktail_id: Mapped[int] = mapped_column(
        ForeignKey("cocktails.id", ondelete="CASCADE"), primary_key=True
    )
    ingredient_id: Mapped[int] = mapped_column(
        ForeignKey("ingredients.id", ondelete="CASCADE"), primary_key=True
    )
    amount: Mapped[str | None] = mapped_column(String(50), nullable=True)
    unit: Mapped[str | None] = mapped_column(String(30), nullable=True)
    is_optional: Mapped[bool] = mapped_column(default=False)

    cocktail: Mapped["Cocktail"] = relationship(back_populates="ingredient_links")
    ingredient: Mapped["Ingredient"] = relationship(back_populates="cocktail_links")
