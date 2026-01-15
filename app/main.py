# main.py

from fastapi import FastAPI

from sqlalchemy import select

from app.db import SessionLocal, engine
from app.models import Base, Meal
from app.routers import meals, system

app = FastAPI(
    title="Campus Bites API",
    version="0.1.0",
)

@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    _seed_meals()


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
