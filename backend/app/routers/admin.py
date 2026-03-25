from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.settings import AppSettings, FilterMode
from app.schemas.auth import TokenData
from app.schemas.settings import AppSettingsResponse, AppSettingsUpdate
from app.services.auth_service import require_admin

router = APIRouter()


@router.get("/settings", response_model=AppSettingsResponse)
def get_settings(
    db: Session = Depends(get_db),
    _: TokenData = Depends(require_admin),
):
    """Get application settings."""
    settings_row = db.query(AppSettings).first()
    if not settings_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Settings not found",
        )
    return settings_row


@router.put("/settings", response_model=AppSettingsResponse)
def update_settings(
    body: AppSettingsUpdate,
    db: Session = Depends(get_db),
    _: TokenData = Depends(require_admin),
):
    """Update application settings."""
    settings_row = db.query(AppSettings).first()
    if not settings_row:
        settings_row = AppSettings(id=1, filter_mode=FilterMode.STRICT)
        db.add(settings_row)
    settings_row.filter_mode = body.filter_mode
    db.commit()
    db.refresh(settings_row)
    return settings_row
