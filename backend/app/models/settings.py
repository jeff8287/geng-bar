import enum
from datetime import datetime

from sqlalchemy import Enum, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class FilterMode(str, enum.Enum):
    STRICT = "strict"
    FLEXIBLE = "flexible"


class AppSettings(Base):
    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    filter_mode: Mapped[FilterMode] = mapped_column(
        Enum(FilterMode), default=FilterMode.STRICT
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
