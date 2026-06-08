from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./campus_bites.db"
    CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )

    # Auth
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "campusbites123"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 8

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
