# meals.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Meal, MealCreate, MealUpdate

router = APIRouter()

def _meal_to_dict(meal: Meal) -> dict:
    return {"id": meal.id, "name": meal.name, "price": meal.price}


@router.get("/meals")
def get_meals(db: Session = Depends(get_db)) -> list[dict]:
    meals = db.execute(select(Meal)).scalars().all()
    return [_meal_to_dict(meal) for meal in meals]


@router.post("/meals")
def create_meal(meal: MealCreate, db: Session = Depends(get_db)) -> dict:
    new_meal = Meal(name=meal.name, price=meal.price)
    db.add(new_meal)
    db.commit()
    db.refresh(new_meal)
    return _meal_to_dict(new_meal)


@router.get("/meals/{meal_id}")
def get_meal(meal_id: int, db: Session = Depends(get_db)) -> dict:
    meal = db.get(Meal, meal_id)
    if meal is None:
        raise HTTPException(status_code=404, detail="Meal not found")
    return _meal_to_dict(meal)


@router.put("/meals/{meal_id}")
def update_meal(
    meal_id: int,
    payload: MealUpdate,
    db: Session = Depends(get_db),
) -> dict:
    meal = db.get(Meal, meal_id)
    if meal is None:
        raise HTTPException(status_code=404, detail="Meal not found")
    if payload.name is not None:
        meal.name = payload.name
    if payload.price is not None:
        meal.price = payload.price
    db.commit()
    db.refresh(meal)
    return _meal_to_dict(meal)


@router.delete("/meals/{meal_id}")
def delete_meal(meal_id: int, db: Session = Depends(get_db)) -> dict:
    meal = db.get(Meal, meal_id)
    if meal is None:
        raise HTTPException(status_code=404, detail="Meal not found")
    db.delete(meal)
    db.commit()
    return {"message": "Meal deleted"}
