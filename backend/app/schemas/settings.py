from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.settings import FilterMode


class AppSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    filter_mode: FilterMode
    updated_at: datetime


class AppSettingsUpdate(BaseModel):
    filter_mode: FilterMode
