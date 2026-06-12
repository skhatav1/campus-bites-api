"""
Runs before alembic upgrade. If the meals table already exists but
alembic_version doesn't, stamps the DB at the correct revision so
alembic only runs the migrations that are actually missing.
"""
import os
from sqlalchemy import create_engine, inspect, text

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./campus_bites.db")


def stamp_if_needed() -> None:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        inspector = inspect(engine)

        # Nothing to do if alembic_version already exists
        if inspector.has_table("alembic_version"):
            return

        if not inspector.has_table("meals"):
            return  # Fresh DB — let alembic run all migrations normally

        # meals table exists but was created by create_all, not alembic.
        # Figure out which revision matches the current schema.
        columns = {c["name"] for c in inspector.get_columns("meals")}

        if "available" in columns:
            revision = "b2c3d4e5f6a7"   # fully up to date
        elif "description" in columns:
            revision = "a1b2c3d4e5f6"   # missing only 'available'
        else:
            revision = "853088fb7455"   # only name + price

        conn.execute(text(
            "CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)"
        ))
        conn.execute(text(
            f"INSERT INTO alembic_version VALUES ('{revision}')"
        ))
        conn.commit()
        print(f"[prestart] Stamped alembic_version at {revision}")


if __name__ == "__main__":
    stamp_if_needed()
