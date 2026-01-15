# main.py

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import select

from app.db import SessionLocal, engine
from app.models import Base, Meal
from app.routers import meals, system
from app.settings import settings

@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    _seed_meals()
    yield


app = FastAPI(
    title="Campus Bites API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _seed_meals() -> None:
    with SessionLocal() as session:
        existing = session.execute(select(Meal).limit(1)).scalar_one_or_none()
        if existing is not None:
            return
        session.add_all(
            [
                Meal(name="Campus Burger", price=8.99),
                Meal(name="Garden Wrap", price=7.49),
                Meal(name="Pasta Primavera", price=10.25),
            ]
        )
        session.commit()

app.include_router(system.router, prefix="/api/v1")
app.include_router(meals.router, prefix="/api/v1")
