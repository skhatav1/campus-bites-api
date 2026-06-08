# Campus Bites

A student-facing campus dining app — browse the current menu, save favorites, compare prices, and build a quick meal plan before leaving class.

## Features

- **Live meal discovery** — real-time search, category filters, and sort (price, name, recommended)
- **Meal plan builder** — add meals to a running tally and see the total at a glance
- **Favorites** — heart meals and filter to your saved picks (persisted in `localStorage`)
- **Admin panel** — hidden `<details>` section for adding, editing, and deleting meals
- **Responsive** — works on mobile (320 px+), tablet, and desktop
- **Skeleton loading** — polished loading state while the API fetches
- **Toast notifications** — non-blocking success/error feedback that auto-dismisses

## Tech stack

| Layer | Tech |
|---|---|
| Backend API | FastAPI 0.127, Python 3.12 |
| ORM | SQLAlchemy 2.0 |
| Validation | Pydantic v2 |
| Database | SQLite (local) / swappable via `DATABASE_URL` |
| Migrations | Alembic |
| Server | Uvicorn |
| Frontend | Vanilla HTML + CSS + JS (no build step) |
| Tests | pytest + HTTPX |
| Deployment | Render (API) + Vercel (frontend) |

## Local development

### Prerequisites

- Python 3.12+
- No Node.js required for the frontend

### Backend

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate          # macOS / Linux
# .\.venv\Scripts\Activate.ps1    # Windows PowerShell

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy and edit environment variables (optional)
cp .env.example .env

# 4. Run database migrations
alembic upgrade head

# 5. Start the API (auto-reloads on save)
uvicorn app.main:app --reload
```

The API starts at `http://127.0.0.1:8000`.  
Interactive docs: `http://127.0.0.1:8000/docs`

> The app also runs `Base.metadata.create_all()` on startup and seeds three sample meals if the table is empty, so step 4 is optional for local dev.

### Frontend

Open a second terminal:

```bash
cd frontend
python3 -m http.server 3000
```

Open `http://127.0.0.1:3000` in your browser.

The frontend reads its API URL from `frontend/config.js`. For local dev it falls back to `http://127.0.0.1:8000` automatically.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./campus_bites.db` | SQLAlchemy connection string |
| `CORS_ORIGINS` | See `.env.example` | JSON array of allowed origins |

## API reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/meals/` | List all meals (supports `?skip=0&limit=100`) |
| `POST` | `/api/v1/meals/` | Create a meal |
| `GET` | `/api/v1/meals/{id}` | Get a single meal |
| `PUT` | `/api/v1/meals/{id}` | Update a meal |
| `DELETE` | `/api/v1/meals/{id}` | Delete a meal |
| `GET` | `/api/v1/health` | Health check (verifies DB connectivity) |

### Meal payload

```json
{
  "name": "Garden Wrap",
  "price": 7.49,
  "description": "Grilled veggies and hummus in a whole-wheat tortilla.",
  "category": "Wraps"
}
```

`description` and `category` are optional.

### Example requests

```bash
# List meals
curl http://127.0.0.1:8000/api/v1/meals/

# Create a meal
curl -X POST http://127.0.0.1:8000/api/v1/meals/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Campus Burger", "price": 8.99, "category": "Mains"}'

# Update a meal
curl -X PUT http://127.0.0.1:8000/api/v1/meals/1 \
  -H "Content-Type: application/json" \
  -d '{"price": 9.49}'

# Delete a meal
curl -X DELETE http://127.0.0.1:8000/api/v1/meals/1

# Health check
curl http://127.0.0.1:8000/api/v1/health
```

## Running tests

```bash
# Install dev dependencies (pytest, httpx)
pip install -r requirements-dev.txt

# Run all tests
python -m pytest

# Verbose output
python -m pytest -v
```

Tests use an isolated in-memory SQLite DB per test, so they never touch your local data.

## Database migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Create a new migration after model changes
alembic revision --autogenerate -m "describe_your_change"

# Roll back one step
alembic downgrade -1
```

## Deployment

### Backend — Render

1. Connect your GitHub repo to [Render](https://render.com).
2. Create a **Web Service** using the `render.yaml` in the repo root.
3. In the Render dashboard → **Environment**, set `CORS_ORIGINS` to a JSON array including your frontend URL:
   ```
   ["https://your-app.vercel.app","http://localhost:3000"]
   ```
4. Deploy. The health-check endpoint (`/api/v1/health`) is configured automatically.

### Frontend — Vercel

1. Import the repo (or just the `frontend/` folder) into [Vercel](https://vercel.com).
2. Set **Output Directory** to `frontend`.
3. Update `frontend/config.js` so `apiBaseUrl` points to your Render backend URL:
   ```js
   window.CAMPUS_BITES_CONFIG = {
     apiBaseUrl: "https://your-backend.onrender.com",
   };
   ```
4. Deploy.

> Students can also override the API URL at runtime via Admin tools → **API connection** without touching the config file.
