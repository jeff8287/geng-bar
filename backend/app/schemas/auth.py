from typing import Optional

from pydantic import BaseModel


class GuestLogin(BaseModel):
    nickname: str


class AdminLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None
    nickname: Optional[str] = None
    is_admin: bool = False
