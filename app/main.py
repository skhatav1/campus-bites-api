from fastapi import FastAPI

app = FastAPI(
    title="Campus Bites API",
    version="0.1.0",
)

@app.get("/health", tags=["system"])
def health_check() -> dict:
    return {"status": "ok"}
