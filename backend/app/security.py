"""JWT encoding/decoding and current-user resolution."""

from datetime import UTC, datetime, timedelta

from fastapi import HTTPException
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .config import get_jwt_secret
from .models import User

ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60


def create_access_token(user_id: int) -> str:
    """Create a signed JWT whose ``sub`` claim carries the user id as a string."""
    expire = datetime.now(UTC) + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, get_jwt_secret(), algorithm=ALGORITHM)


def get_current_user(authorization: str | None, db: Session) -> User:
    """Resolve the user for a ``Bearer`` token, raising 401 when it is absent/invalid."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Nicht angemeldet")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Ungültiger Authorization-Header")

    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Ungültiges Token") from None

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Benutzer nicht gefunden")
    return user
