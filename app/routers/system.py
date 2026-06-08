# system.py

from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.db import engine

router = APIRouter()


@router.get("/", tags=["system"])
def root() -> dict:
    return {"message": "Campus Bites API"}


@router.get("/health", tags=["system"])
def health_check() -> dict:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {exc}") from exc
    return {"status": "ok"}
