# Campus Bites API

Campus Bites API is a small CRUD API for campus meal listings. It is built with FastAPI, SQLAlchemy, SQLite, and Alembic migrations.

## Tech stack
- FastAPI
- Pydantic
- SQLAlchemy
- SQLite
- Alembic
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

Optional environment variables can be copied from `.env.example`:
```bash
cp .env.example .env
```

By default the API uses `sqlite:///./campus_bites.db`.

## Run database migrations
```bash
alembic upgrade head
```

The app also creates missing tables on startup for local development.

## Run the API
```bash
uvicorn app.main:app --reload
```

## Swagger UI
Open `http://127.0.0.1:8000/docs` in your browser to view and test the API.

## Frontend
This repo includes a static frontend in `frontend/`.

Start the API:
```bash
.venv/bin/uvicorn app.main:app --reload
```

In a second terminal, serve the frontend:
```bash
cd frontend
python3 -m http.server 3000
```

Open `http://127.0.0.1:3000`.

For deployment, update `frontend/config.js` so `apiBaseUrl` points to the public backend URL.

## Health check
```bash
curl http://127.0.0.1:8000/api/v1/health
```

## Run tests
```bash
python -m pytest
```

## Example requests
Get all meals:
```bash
curl http://127.0.0.1:8000/api/v1/meals/
```

Create a meal:
```bash
curl -X POST http://127.0.0.1:8000/api/v1/meals/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Campus Burger", "price": 8.99}'
```

Update a meal:
```bash
curl -X PUT http://127.0.0.1:8000/api/v1/meals/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Burger", "price": 9.49}'
```

Delete a meal:
```bash
curl -X DELETE http://127.0.0.1:8000/api/v1/meals/1
```
