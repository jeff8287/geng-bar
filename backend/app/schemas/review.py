from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ReviewBase(BaseModel):
    nickname: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class ReviewCreate(BaseModel):
    """Create schema - nickname comes from JWT token, not body."""
    nickname: Optional[str] = None
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class ReviewResponse(ReviewBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cocktail_id: int
    created_at: datetime
