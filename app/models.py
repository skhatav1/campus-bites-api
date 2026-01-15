from pydantic import BaseModel


class MealCreate(BaseModel):
    name: str
    price: float


class MealUpdate(BaseModel):
    name: str | None = None
    price: float | None = None
