# Campus Bites API

Campus Bites API is a simple CRUD API for meals. It is built with FastAPI and uses an in-memory list to store meals so you can learn and test API basics quickly.

## Tech stack
- FastAPI
- Pydantic
- Uvicorn

## Setup
1) Create and activate a virtual environment.
2) Install dependencies from `requirements.txt`.

Example (macOS/Linux):
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Example (Windows PowerShell):
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run the API
```bash
uvicorn app.main:app --reload
```

## Swagger UI
Open `http://127.0.0.1:8000/docs` in your browser to view and test the API.

## Example requests
Get all meals:
```bash
curl http://127.0.0.1:8000/meals
```

Create a meal:
```bash
curl -X POST http://127.0.0.1:8000/meals \
  -H "Content-Type: application/json" \
  -d '{"name": "Campus Burger", "price": 8.99}'
```

Update a meal:
```bash
curl -X PUT http://127.0.0.1:8000/meals/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Burger", "price": 9.49}'
```

Delete a meal:
```bash
curl -X DELETE http://127.0.0.1:8000/meals/1
```
