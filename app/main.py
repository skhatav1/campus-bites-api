from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

MEALS = [
    {"id": 1, "name": "Campus Burger", "price": 8.99},
    {"id": 2, "name": "Garden Wrap", "price": 7.49},
    {"id": 3, "name": "Pasta Primavera", "price": 10.25},
]

app = FastAPI(
    title="Campus Bites API",
    version="0.1.0",
)

class MealCreate(BaseModel):
    name: str
    price: float

class MealUpdate(BaseModel):
    name: str | None = None
    price: float | None = None

@app.get("/", tags=["system"]) #tags is a named argument only for organizing the docs page
def root() -> dict:
    return {"message": "Campus Bites API"}

@app.get("/health", tags=["system"])
def health_check() -> dict:
    return {"status": "ok"}

@app.get("/greet")
def greet(name: str = "Guest") -> dict:
    return {"message": f"Hello {name}"}

@app.get("/meals")
def get_meals():
    return MEALS

@app.post("/meals")
def create_meal(meal: MealCreate) -> dict:
    next_id = max((item["id"] for item in MEALS), default=0) + 1
    new_meal = {"id": next_id, "name": meal.name, "price": meal.price}
    MEALS.append(new_meal)
    return new_meal

@app.get("/meals/{meal_id}")
def get_meal(meal_id: int) -> dict:
    for meal in MEALS:
        if meal["id"] == meal_id:
            return meal
    raise HTTPException(status_code=404, detail="Meal not found")

@app.put("/meals/{meal_id}")
def update_meal(meal_id: int, payload: MealUpdate) -> dict:
    for meal in MEALS:
        if meal["id"] == meal_id:
            if payload.name is not None:
                meal["name"] = payload.name
            if payload.price is not None:
                meal["price"] = payload.price
            return meal
    raise HTTPException(status_code=404, detail="Meal not found")

@app.delete("/meals/{meal_id}")
def delete_meal(meal_id: int) -> dict:
    for index, meal in enumerate(MEALS):
        if meal["id"] == meal_id:
            del MEALS[index]
            return {"message": "Meal deleted"}
    raise HTTPException(status_code=404, detail="Meal not found")
