"""Outfit routes: CRUD with ownership checks.

Every operation resolves the current user via ``get_current_user`` and only
touches outfits/items that belong to them. Foreign or missing ids answer 404,
indistinguishable from "not found", as required by AC-10.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from .db import SessionLocal
from .models import Item, Outfit, User
from .schemas import OutfitCreate, OutfitOut, OutfitUpdate
from .security import get_current_user

router = APIRouter(prefix="/api/outfits", tags=["outfits"])


def get_db():
    """Yield a database session for the lifetime of a request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _to_outfit(outfit: Outfit) -> OutfitOut:
    """Serialize an Outfit ORM object into the public response shape."""
    return OutfitOut(
        id=outfit.id,
        name=outfit.name,
        item_ids=[item.id for item in outfit.items],
    )


def _get_owned_outfit(outfit_id: int, user: User, db: Session) -> Outfit:
    """Return the outfit if it belongs to the user, otherwise 404."""
    outfit = db.get(Outfit, outfit_id)
    if outfit is None or outfit.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Outfit nicht gefunden")
    return outfit


def _resolve_items(item_ids: list[int], user: User, db: Session) -> list[Item]:
    """Resolve every item id, 404 when any is missing or not owned by the user."""
    items: list[Item] = []
    for item_id in item_ids:
        item = db.get(Item, item_id)
        if item is None or item.owner_id != user.id:
            raise HTTPException(status_code=404, detail="Kleidungsstück nicht gefunden")
        items.append(item)
    return items


@router.get("", response_model=list[OutfitOut])
def list_outfits(
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> list[OutfitOut]:
    """List the current user's outfits only."""
    user = get_current_user(authorization, db)
    outfits = db.query(Outfit).filter(Outfit.owner_id == user.id).all()
    return [_to_outfit(outfit) for outfit in outfits]


@router.post("", status_code=201, response_model=OutfitOut)
def create_outfit(
    body: OutfitCreate,
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> OutfitOut:
    """Create an outfit from items that all belong to the current user."""
    user = get_current_user(authorization, db)
    items = _resolve_items(body.item_ids, user, db)
    outfit = Outfit(name=body.name, owner_id=user.id, items=items)
    db.add(outfit)
    db.commit()
    db.refresh(outfit)
    return _to_outfit(outfit)


@router.get("/{outfit_id}", response_model=OutfitOut)
def get_outfit(
    outfit_id: int,
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> OutfitOut:
    """Return one outfit, 404 for foreign or missing ids."""
    user = get_current_user(authorization, db)
    outfit = _get_owned_outfit(outfit_id, user, db)
    return _to_outfit(outfit)


@router.patch("/{outfit_id}", response_model=OutfitOut)
def update_outfit(
    outfit_id: int,
    body: OutfitUpdate,
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> OutfitOut:
    """Update an outfit's name and item list, 404 for foreign or missing ids."""
    user = get_current_user(authorization, db)
    outfit = _get_owned_outfit(outfit_id, user, db)
    items = _resolve_items(body.item_ids, user, db)
    outfit.name = body.name
    outfit.items = items
    db.commit()
    db.refresh(outfit)
    return _to_outfit(outfit)


@router.delete("/{outfit_id}", status_code=204)
def delete_outfit(
    outfit_id: int,
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> None:
    """Delete an outfit, 404 for foreign or missing ids."""
    user = get_current_user(authorization, db)
    outfit = _get_owned_outfit(outfit_id, user, db)
    db.delete(outfit)
    db.commit()
