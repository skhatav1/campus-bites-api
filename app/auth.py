# auth.py

from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.settings import settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
_bearer = HTTPBearer(auto_error=False)

ALGORITHM = "HS256"


def verify_admin_credentials(username: str, password: str) -> bool:
    return username == settings.ADMIN_USERNAME and password == settings.ADMIN_PASSWORD


def create_access_token() -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode(
        {"sub": settings.ADMIN_USERNAME, "exp": expire},
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )


def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> str:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise exc
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        if username != settings.ADMIN_USERNAME:
            raise exc
    except JWTError:
        raise exc
    return username
