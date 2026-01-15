import os
import importlib
import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path, monkeypatch):
    """
    Creates a fresh SQLite DB file for each test run and ensures the app imports
    using that DATABASE_URL (so we never touch the real campus_bites.db).
    """
    db_file = tmp_path / "test.db"
    # Absolute file path needs 4 slashes: sqlite:////absolute/path/to.db
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_file}")

    # If you use JSON list for CORS_ORIGINS, keep it valid JSON
    monkeypatch.setenv(
        "CORS_ORIGINS",
        '["http://localhost:3000","http://127.0.0.1:3000"]',
    )

    # Reload modules so they pick up the env vars we just set
    import app.settings as settings_mod
    import app.db as db_mod
    import app.main as main_mod

    importlib.reload(settings_mod)
    importlib.reload(db_mod)
    importlib.reload(main_mod)

    with TestClient(main_mod.app) as c:
        yield c
