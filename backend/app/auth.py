"""Authentication routes (registration, login, JWT, account deletion).

This ticket only wires the router; the handlers are filled in by the
authentication ticket and answer 501 Not Implemented until then.
"""

from typing import Annotated

from fastapi import APIRouter, Header, HTTPException

router = APIRouter(prefix="/api/auth", tags=["auth"])

_NOT_IMPLEMENTED = "Registrierung/Login wird noch implementiert"


@router.post("/register", status_code=201)
def register(body: dict) -> dict:
    raise HTTPException(status_code=501, detail=_NOT_IMPLEMENTED)


@router.post("/login")
def login(body: dict) -> dict:
    raise HTTPException(status_code=501, detail=_NOT_IMPLEMENTED)


@router.get("/me")
def me(authorization: Annotated[str | None, Header()] = None) -> dict:
    raise HTTPException(status_code=501, detail=_NOT_IMPLEMENTED)


@router.post("/logout", status_code=204)
def logout(authorization: Annotated[str | None, Header()] = None) -> None:
    raise HTTPException(status_code=501, detail=_NOT_IMPLEMENTED)


@router.delete("/account", status_code=204)
def delete_account(authorization: Annotated[str | None, Header()] = None) -> None:
    raise HTTPException(status_code=501, detail=_NOT_IMPLEMENTED)
