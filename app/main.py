# main.py

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import select

from app.db import SessionLocal, engine
from app.models import Base, Meal
from app.routers import meals, system
from app.settings import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    _seed_meals()
    logger.info("Campus Bites API started")
    yield
    logger.info("Campus Bites API shutting down")


app = FastAPI(
    title="Campus Bites API",
    version="1.0.0",
    description="Student dining guide API — browse, add, and manage campus meals.",
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
                Meal(
                    name="Campus Burger",
                    price=8.99,
                    description="A juicy quarter-pound beef patty with lettuce, tomato, and house sauce on a brioche bun.",
                    category="Mains",
                ),
                Meal(
                    name="Garden Wrap",
                    price=7.49,
                    description="Grilled veggies, hummus, and mixed greens wrapped in a whole-wheat tortilla.",
                    category="Wraps",
                ),
                Meal(
                    name="Pasta Primavera",
                    price=10.25,
                    description="Penne with seasonal vegetables in a light garlic-olive oil sauce, topped with parmesan.",
                    category="Mains",
                ),
            ]
        )
        session.commit()

app.include_router(system.router, prefix="/api/v1")
app.include_router(meals.router, prefix="/api/v1")
