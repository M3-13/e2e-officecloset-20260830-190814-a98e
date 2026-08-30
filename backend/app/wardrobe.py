"""Wardrobe (clothing item) routes.

This ticket only wires the router; the handlers are filled in by the
wardrobe-CRUD ticket and answer 501 Not Implemented until then.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/wardrobe", tags=["wardrobe"])

_NOT_IMPLEMENTED = "Kleidungsstück-CRUD wird noch implementiert"


@router.get("/items")
def list_items() -> list:
    raise HTTPException(status_code=501, detail=_NOT_IMPLEMENTED)


@router.post("/items", status_code=201)
def create_item() -> dict:
    raise HTTPException(status_code=501, detail=_NOT_IMPLEMENTED)


@router.get("/items/{item_id}")
def get_item(item_id: int) -> dict:
    raise HTTPException(status_code=501, detail=_NOT_IMPLEMENTED)


@router.patch("/items/{item_id}")
def update_item(item_id: int) -> dict:
    raise HTTPException(status_code=501, detail=_NOT_IMPLEMENTED)


@router.delete("/items/{item_id}", status_code=204)
def delete_item(item_id: int) -> None:
    raise HTTPException(status_code=501, detail=_NOT_IMPLEMENTED)
