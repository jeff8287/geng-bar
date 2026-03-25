from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import AdminLogin, GuestLogin, Token, TokenData
from app.services.auth_service import (
    create_access_token,
    get_current_user,
    verify_password,
)

router = APIRouter()


@router.post("/guest", response_model=Token, status_code=status.HTTP_201_CREATED)
def create_guest_session(body: GuestLogin):
    """Create a guest session token with nickname."""
    token = create_access_token({"nickname": body.nickname, "is_admin": False})
    return Token(access_token=token, token_type="bearer")


@router.post("/admin/login", response_model=Token)
def admin_login(body: AdminLogin, db: Session = Depends(get_db)):
    """Authenticate admin and return JWT."""
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not an admin",
        )
    token = create_access_token({"sub": user.username, "is_admin": True})
    return Token(access_token=token, token_type="bearer")


@router.get("/me", response_model=TokenData)
def get_me(current_user: TokenData = Depends(get_current_user)):
    """Return current user info decoded from token."""
    return current_user
