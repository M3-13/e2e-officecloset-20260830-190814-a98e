"""Authentication routes: registration, login, JWT session and account deletion.

Passwords are hashed with Argon2 (``$argon2id$`` prefix); JWT tokens are minted
and verified through ``app.security``. The ``/register`` and ``/login`` endpoints
are rate-limited per client (max 5 requests per minute) with a simple in-memory
limiter.
"""

import re
import threading
import time
from collections import defaultdict
from collections.abc import Iterator
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from passlib.hash import argon2
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .db import SessionLocal
from .models import Item, User
from .schemas import Token, UserOut
from .security import create_access_token, get_current_user
from .storage import delete_image

router = APIRouter(prefix="/api/auth", tags=["auth"])

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

_RATE_LIMIT = 5
_RATE_WINDOW_SECONDS = 60.0
_rate_lock = threading.Lock()
_rate_store: dict[str, list[float]] = defaultdict(list)


class AuthCredentials(BaseModel):
    email: str
    password: str


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _client_key(request: Request) -> str:
    client = request.client
    return client.host if client else "unknown"


def _enforce_rate_limit(request: Request) -> None:
    """Reject a client that has made too many requests within the window."""
    key = _client_key(request)
    now = time.monotonic()
    with _rate_lock:
        timestamps = [t for t in _rate_store[key] if now - t < _RATE_WINDOW_SECONDS]
        if len(timestamps) >= _RATE_LIMIT:
            raise HTTPException(
                status_code=429, detail="Zu viele Anfragen. Bitte versuchen Sie es später erneut."
            )
        timestamps.append(now)
        _rate_store[key] = timestamps


def reset_rate_limits() -> None:
    """Clear the in-memory limiter (used by tests)."""
    with _rate_lock:
        _rate_store.clear()


def _validate_email(email: str) -> None:
    if not _EMAIL_RE.match(email or ""):
        raise HTTPException(status_code=400, detail="Ungültige E-Mail-Adresse")


@router.post("/register", status_code=201, response_model=Token)
def register(body: AuthCredentials, request: Request, db: Session = Depends(get_db)) -> Token:
    _enforce_rate_limit(request)
    _validate_email(body.email)
    if not body.password:
        raise HTTPException(status_code=400, detail="Passwort darf nicht leer sein")
    if db.query(User).filter(User.email == body.email).first() is not None:
        raise HTTPException(status_code=409, detail="E-Mail bereits registriert")

    user = User(email=body.email, hashed_password=argon2.hash(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return Token(access_token=create_access_token(user.id))


@router.post("/login", response_model=Token)
def login(body: AuthCredentials, request: Request, db: Session = Depends(get_db)) -> Token:
    _enforce_rate_limit(request)

    user = db.query(User).filter(User.email == body.email).first()
    if user is not None:
        try:
            valid = argon2.verify(body.password, user.hashed_password)
        except (ValueError, TypeError):
            valid = False
    else:
        valid = False

    if not valid:
        raise HTTPException(status_code=401, detail="Ungültige E-Mail oder Passwort")
    return Token(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserOut)
def me(
    authorization: Annotated[str | None, Header()] = None, db: Session = Depends(get_db)
) -> UserOut:
    user = get_current_user(authorization, db)
    return UserOut(id=user.id, email=user.email)


@router.post("/logout", status_code=204)
def logout(
    authorization: Annotated[str | None, Header()] = None, db: Session = Depends(get_db)
) -> None:
    get_current_user(authorization, db)
    return None


@router.delete("/account", status_code=204)
def delete_account(
    authorization: Annotated[str | None, Header()] = None, db: Session = Depends(get_db)
) -> None:
    user = get_current_user(authorization, db)

    items = db.query(Item).filter(Item.owner_id == user.id).all()
    for item in items:
        delete_image(item.image_url)

    db.delete(user)
    db.commit()
    return None
