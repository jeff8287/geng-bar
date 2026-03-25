from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.ingredient import Ingredient, IngredientStatus
from app.schemas.ingredient import IngredientCreate, IngredientUpdate, IngredientStatusUpdate


class IngredientService:
    @staticmethod
    def get_all(db: Session, category: Optional[str] = None) -> list[Ingredient]:
        query = db.query(Ingredient)
        if category:
            query = query.filter(Ingredient.category == category)
        return query.order_by(Ingredient.category, Ingredient.name).all()

    @staticmethod
    def get_by_id(db: Session, ingredient_id: int) -> Ingredient:
        ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
        if not ingredient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ingredient {ingredient_id} not found",
            )
        return ingredient

    @staticmethod
    def create(db: Session, schema: IngredientCreate) -> Ingredient:
        existing = db.query(Ingredient).filter(Ingredient.name == schema.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ingredient '{schema.name}' already exists",
            )
        ingredient = Ingredient(**schema.model_dump())
        db.add(ingredient)
        db.commit()
        db.refresh(ingredient)
        return ingredient

    @staticmethod
    def update(db: Session, ingredient_id: int, schema: IngredientUpdate) -> Ingredient:
        ingredient = IngredientService.get_by_id(db, ingredient_id)
        for field, value in schema.model_dump(exclude_unset=True).items():
            setattr(ingredient, field, value)
        db.commit()
        db.refresh(ingredient)
        return ingredient

    @staticmethod
    def update_status(db: Session, ingredient_id: int, schema: IngredientStatusUpdate) -> Ingredient:
        ingredient = IngredientService.get_by_id(db, ingredient_id)
        ingredient.status = schema.status
        db.commit()
        db.refresh(ingredient)
        return ingredient

    @staticmethod
    def delete(db: Session, ingredient_id: int) -> None:
        ingredient = IngredientService.get_by_id(db, ingredient_id)
        db.delete(ingredient)
        db.commit()
