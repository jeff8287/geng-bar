from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, SessionLocal
from app.models import Base, AppSettings, User
from app.models.settings import FilterMode
from app.routers import ingredients, cocktails, reviews, auth, admin, menu


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _seed_defaults()
    yield


def _seed_defaults():
    db = SessionLocal()
    try:
        if not db.query(AppSettings).first():
            db.add(AppSettings(id=1, filter_mode=FilterMode.STRICT))
            db.commit()
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        if not db.query(User).filter(User.username == settings.ADMIN_USERNAME).first():
            db.add(
                User(
                    username=settings.ADMIN_USERNAME,
                    password_hash=pwd_context.hash(settings.ADMIN_PASSWORD),
                    is_admin=True,
                )
            )
            db.commit()
    finally:
        db.close()


app = FastAPI(title="Home Cocktail Bar", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(menu.router, prefix="/api/menu", tags=["menu"])
app.include_router(ingredients.router, prefix="/api/ingredients", tags=["ingredients"])
app.include_router(cocktails.router, prefix="/api/cocktails", tags=["cocktails"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["reviews"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

media_path = Path(settings.MEDIA_DIR)
media_path.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(media_path.parent)), name="media")


@app.get("/health")
def health():
    return {"status": "ok"}
