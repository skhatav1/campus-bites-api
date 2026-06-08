# meals.py

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Meal, MealCreate, MealOut, MealUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/meals", tags=["meals"])


@router.get("/", response_model=list[MealOut])
def get_meals(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[Meal]:
    return list(db.execute(select(Meal).order_by(Meal.id).offset(skip).limit(limit)).scalars().all())


@router.post("/", response_model=MealOut, status_code=status.HTTP_201_CREATED)
def create_meal(meal: MealCreate, db: Session = Depends(get_db)) -> Meal:
    new_meal = Meal(
        name=meal.name,
        price=meal.price,
        description=meal.description,
        category=meal.category,
    )
    db.add(new_meal)
    db.commit()
    db.refresh(new_meal)
    logger.info("Created meal id=%s name=%r", new_meal.id, new_meal.name)
    return new_meal


@router.get("/{meal_id}", response_model=MealOut)
def get_meal(meal_id: int, db: Session = Depends(get_db)) -> Meal:
    meal = db.get(Meal, meal_id)
    if meal is None:
        raise HTTPException(status_code=404, detail="Meal not found")
    return meal


@router.put("/{meal_id}", response_model=MealOut)
def update_meal(
    meal_id: int,
    payload: MealUpdate,
    db: Session = Depends(get_db),
) -> Meal:
    meal = db.get(Meal, meal_id)
    if meal is None:
        raise HTTPException(status_code=404, detail="Meal not found")
    if payload.name is not None:
        meal.name = payload.name
    if payload.price is not None:
        meal.price = payload.price
    if payload.description is not None:
        meal.description = payload.description
    if payload.category is not None:
        meal.category = payload.category
    db.commit()
    db.refresh(meal)
    logger.info("Updated meal id=%s", meal_id)
    return meal


@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal(meal_id: int, db: Session = Depends(get_db)) -> Response:
    meal = db.get(Meal, meal_id)
    if meal is None:
        raise HTTPException(status_code=404, detail="Meal not found")
    db.delete(meal)
    db.commit()
    logger.info("Deleted meal id=%s", meal_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
