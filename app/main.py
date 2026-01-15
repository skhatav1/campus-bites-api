from fastapi import FastAPI

from app.routers import meals, system

app = FastAPI(
    title="Campus Bites API",
    version="0.1.0",
)

app.include_router(system.router)
app.include_router(meals.router)
