# Deployment

## Backend on Render

This repo includes `render.yaml` for deploying the FastAPI backend as a Render web service.

### Dashboard settings

If you create the service manually in Render, use:

- Runtime: `Python`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health Check Path: `/api/v1/health`

### Environment variables

For the first backend deployment:

```text
PYTHON_VERSION=3.12.12
DATABASE_URL=sqlite:///./campus_bites.db
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

After the Vercel frontend is deployed, update `CORS_ORIGINS` to include the Vercel URL:

```text
CORS_ORIGINS=["https://your-vercel-site.vercel.app"]
```

For a more durable production setup, replace SQLite with a hosted PostgreSQL database and set `DATABASE_URL` to the PostgreSQL connection string.

### Verify deployment

After Render deploys the service, open:

```text
https://your-render-service.onrender.com/api/v1/health
```

Expected response:

```json
{"status":"ok"}
```

Then test the meals endpoint:

```text
https://your-render-service.onrender.com/api/v1/meals/
```
