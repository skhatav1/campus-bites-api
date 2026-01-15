from fastapi import APIRouter, HTTPException

from app.models import MealCreate, MealUpdate

router = APIRouter()

MEALS = [
    {"id": 1, "name": "Campus Burger", "price": 8.99},
    {"id": 2, "name": "Garden Wrap", "price": 7.49},
    {"id": 3, "name": "Pasta Primavera", "price": 10.25},
]


@router.get("/meals")
def get_meals():
    return MEALS


@router.post("/meals")
def create_meal(meal: MealCreate) -> dict:
    next_id = max((item["id"] for item in MEALS), default=0) + 1
    new_meal = {"id": next_id, "name": meal.name, "price": meal.price}
    MEALS.append(new_meal)
    return new_meal


@router.get("/meals/{meal_id}")
def get_meal(meal_id: int) -> dict:
    for meal in MEALS:
        if meal["id"] == meal_id:
            return meal
    raise HTTPException(status_code=404, detail="Meal not found")


@router.put("/meals/{meal_id}")
def update_meal(meal_id: int, payload: MealUpdate) -> dict:
    for meal in MEALS:
        if meal["id"] == meal_id:
            if payload.name is not None:
                meal["name"] = payload.name
            if payload.price is not None:
                meal["price"] = payload.price
            return meal
    raise HTTPException(status_code=404, detail="Meal not found")


@router.delete("/meals/{meal_id}")
def delete_meal(meal_id: int) -> dict:
    for index, meal in enumerate(MEALS):
        if meal["id"] == meal_id:
            del MEALS[index]
            return {"message": "Meal deleted"}
    raise HTTPException(status_code=404, detail="Meal not found")
