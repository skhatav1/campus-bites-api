# models.py

from pydantic import BaseModel
from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Meal(Base):
    __tablename__ = "meals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)


class MealCreate(BaseModel):
    name: str
    price: float


class MealUpdate(BaseModel):
    name: str | None = None
    price: float | None = None
