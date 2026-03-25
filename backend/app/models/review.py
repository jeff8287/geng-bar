from datetime import datetime

from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (CheckConstraint("rating >= 1 AND rating <= 5", name="rating_range"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    cocktail_id: Mapped[int] = mapped_column(
        ForeignKey("cocktails.id", ondelete="CASCADE"), index=True
    )
    nickname: Mapped[str] = mapped_column(String(100))
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    cocktail: Mapped["Cocktail"] = relationship(back_populates="reviews")
