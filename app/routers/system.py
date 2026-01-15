from fastapi import APIRouter

router = APIRouter()


@router.get("/", tags=["system"])
def root() -> dict:
    return {"message": "Campus Bites API"}


@router.get("/health", tags=["system"])
def health_check() -> dict:
    return {"status": "ok"}


@router.get("/greet")
def greet(name: str = "Guest") -> dict:
    return {"message": f"Hello {name}"}
