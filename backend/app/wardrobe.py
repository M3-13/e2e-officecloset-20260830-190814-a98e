"""Wardrobe (clothing item) routes: CRUD with image upload and ownership checks.

Only the authenticated owner may list, read, update or delete an item; any
foreign or missing id is reported as 404. Images are stored under
``/uploads/<file>`` via :func:`app.storage.save_image`, and uploads are capped
at 5 MB with the size checked from the ``Content-Length`` header before the
request body is read.
"""

from collections.abc import Generator
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session

from .db import SessionLocal
from .models import Item
from .schemas import ItemOut
from .security import get_current_user
from .storage import delete_image, save_image

router = APIRouter(prefix="/api/wardrobe", tags=["wardrobe"])

MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


def get_db() -> Generator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_upload_size(request: Request) -> None:
    content_length = request.headers.get("content-length")
    if content_length and content_length.isdigit() and int(content_length) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="Upload zu groß (max. 5 MB)")


def _owned_item(db: Session, item_id: int, user_id: int) -> Item:
    item = db.get(Item, item_id)
    if item is None or item.owner_id != user_id:
        raise HTTPException(status_code=404, detail="Kleidungsstück nicht gefunden")
    return item


def _process_image(image: UploadFile | None) -> str | None:
    if image is None:
        return None
    if (image.content_type or "") not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Unpassender Bildtyp")
    data = image.file.read()
    if len(data) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="Upload zu groß (max. 5 MB)")
    return save_image(data, image.filename or "image")


@router.get("/items", response_model=list[ItemOut])
def list_items(
    authorization: Annotated[str | None, Header()] = None,
    category: str | None = None,
    db: Session = Depends(get_db),
) -> list[Item]:
    user = get_current_user(authorization, db)
    query = db.query(Item).filter(Item.owner_id == user.id)
    if category:
        query = query.filter(Item.category == category)
    return query.all()


@router.post("/items", status_code=201, response_model=ItemOut)
def create_item(
    name: Annotated[str, Form()],
    category: Annotated[str, Form()],
    color: Annotated[str | None, Form()] = None,
    season: Annotated[str | None, Form()] = None,
    image: Annotated[UploadFile | None, File()] = None,
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
    _size: None = Depends(check_upload_size),
) -> Item:
    user = get_current_user(authorization, db)
    item = Item(
        name=name,
        category=category,
        color=color,
        season=season,
        image_url=_process_image(image),
        owner_id=user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/items/{item_id}", response_model=ItemOut)
def get_item(
    item_id: int,
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> Item:
    user = get_current_user(authorization, db)
    return _owned_item(db, item_id, user.id)


@router.patch("/items/{item_id}", response_model=ItemOut)
def update_item(
    item_id: int,
    name: Annotated[str, Form()],
    category: Annotated[str, Form()],
    color: Annotated[str | None, Form()] = None,
    season: Annotated[str | None, Form()] = None,
    image: Annotated[UploadFile | None, File()] = None,
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
    _size: None = Depends(check_upload_size),
) -> Item:
    user = get_current_user(authorization, db)
    item = _owned_item(db, item_id, user.id)
    item.name = name
    item.category = category
    item.color = color
    item.season = season
    if image is not None:
        new_url = _process_image(image)
        if new_url is not None:
            delete_image(item.image_url)
            item.image_url = new_url
    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=204)
def delete_item(
    item_id: int,
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> None:
    user = get_current_user(authorization, db)
    item = _owned_item(db, item_id, user.id)
    delete_image(item.image_url)
    db.delete(item)
    db.commit()
