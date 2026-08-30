"""Outfit routes.

This ticket only wires the router; the handlers are filled in by the
outfit-CRUD ticket and answer 501 Not Implemented until then.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/outfits", tags=["outfits"])

_NOT_IMPLEMENTED = "Outfit-CRUD wird noch implementiert"


@router.get("")
def list_outfits() -> list:
    raise HTTPException(status_code=501, detail=_NOT_IMPLEMENTED)


@router.post("", status_code=201)
def create_outfit() -> dict:
    raise HTTPException(status_code=501, detail=_NOT_IMPLEMENTED)


@router.get("/{outfit_id}")
def get_outfit(outfit_id: int) -> dict:
    raise HTTPException(status_code=501, detail=_NOT_IMPLEMENTED)


@router.patch("/{outfit_id}")
def update_outfit(outfit_id: int) -> dict:
    raise HTTPException(status_code=501, detail=_NOT_IMPLEMENTED)


@router.delete("/{outfit_id}", status_code=204)
def delete_outfit(outfit_id: int) -> None:
    raise HTTPException(status_code=501, detail=_NOT_IMPLEMENTED)
