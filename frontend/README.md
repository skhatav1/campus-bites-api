# Campus Bites Frontend

Static student-facing frontend for the Campus Bites FastAPI backend.

The default screen is a meal discovery experience with search, filters, favorites, and a local meal plan. Menu management lives under the collapsed Admin tools section.

## Run locally

Start the backend from the repo root:

```bash
.venv/bin/uvicorn app.main:app --reload
```

Then serve this folder:

```bash
cd frontend
python3 -m http.server 3000
```

Open `http://127.0.0.1:3000`.

## Configure the API URL

The default API URL is set in `config.js`:

```js
window.CAMPUS_BITES_CONFIG = {
  apiBaseUrl: "http://127.0.0.1:8000",
};
```

For deployment, change `apiBaseUrl` to the public backend URL.
