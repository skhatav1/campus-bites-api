# models.py

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Meal(Base):
    __tablename__ = "meals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    available: Mapped[bool] = mapped_column(default=True, server_default="1")


class MealCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    price: float = Field(gt=0)
    description: str | None = Field(default=None, max_length=300)
    category: str | None = Field(default=None, max_length=60)


class MealUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    price: float | None = Field(default=None, gt=0)
    description: str | None = Field(default=None, max_length=300)
    category: str | None = Field(default=None, max_length=60)


class MealOut(BaseModel):
    id: int
    name: str
    price: float
    description: str | None = None
    category: str | None = None
    available: bool = True

    model_config = ConfigDict(from_attributes=True)
