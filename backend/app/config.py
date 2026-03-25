from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://cocktail:cocktail@localhost:5432/cocktail_db"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours for party-length sessions
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin"
    CORS_ORIGINS: str = "*"
    MEDIA_DIR: str = "media/cocktails"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
