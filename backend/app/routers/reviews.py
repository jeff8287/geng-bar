from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.cocktail import Cocktail
from app.models.review import Review
from app.schemas.auth import TokenData
from app.schemas.review import ReviewCreate, ReviewResponse
from app.services.auth_service import get_current_guest

router = APIRouter()


@router.get("/{cocktail_id}", response_model=list[ReviewResponse])
def list_reviews(cocktail_id: int, db: Session = Depends(get_db)):
    """List all reviews for a cocktail (public)."""
    cocktail = db.query(Cocktail).filter(Cocktail.id == cocktail_id).first()
    if not cocktail:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cocktail not found")
    return db.query(Review).filter(Review.cocktail_id == cocktail_id).order_by(Review.created_at.desc()).all()


@router.post("/{cocktail_id}", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    cocktail_id: int,
    body: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_guest),
):
    """Create a review. Nickname is taken from the token."""
    cocktail = db.query(Cocktail).filter(Cocktail.id == cocktail_id).first()
    if not cocktail:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cocktail not found")

    # Use nickname from token; fallback to body.nickname for admin
    nickname = current_user.nickname or current_user.username or body.nickname
    review = Review(
        cocktail_id=cocktail_id,
        nickname=nickname,
        rating=body.rating,
        comment=body.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review
