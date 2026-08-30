"""Tests for the outfit CRUD endpoints and their ownership checks."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base
from app.main import app
from app.models import Item, User
from app.outfits import get_db
from app.security import create_access_token

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture()
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)


def _create_user(email: str = "a@example.com") -> User:
    db = TestingSessionLocal()
    user = User(email=email, hashed_password="x")
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


def _create_item(owner_id: int, name: str = "T-Shirt") -> Item:
    db = TestingSessionLocal()
    item = Item(name=name, category="Oberteil", owner_id=owner_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    db.close()
    return item


def _auth(user_id: int) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user_id)}"}


def test_create_outfit(client: TestClient) -> None:
    user = _create_user()
    item = _create_item(user.id)
    response = client.post(
        "/api/outfits",
        json={"name": "Business", "item_ids": [item.id]},
        headers=_auth(user.id),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Business"
    assert body["item_ids"] == [item.id]


def test_list_returns_only_own_outfits(client: TestClient) -> None:
    user_a = _create_user("a@example.com")
    user_b = _create_user("b@example.com")
    item_a = _create_item(user_a.id, "Eigene")
    item_b = _create_item(user_b.id, "Fremde")
    client.post(
        "/api/outfits",
        json={"name": "A", "item_ids": [item_a.id]},
        headers=_auth(user_a.id),
    )
    client.post(
        "/api/outfits",
        json={"name": "B", "item_ids": [item_b.id]},
        headers=_auth(user_b.id),
    )
    response = client.get("/api/outfits", headers=_auth(user_a.id))
    assert response.status_code == 200
    names = [o["name"] for o in response.json()]
    assert names == ["A"]


def test_get_own_outfit(client: TestClient) -> None:
    user = _create_user()
    item = _create_item(user.id)
    created = client.post(
        "/api/outfits",
        json={"name": "Outfit", "item_ids": [item.id]},
        headers=_auth(user.id),
    ).json()
    response = client.get(f"/api/outfits/{created['id']}", headers=_auth(user.id))
    assert response.status_code == 200
    assert response.json()["name"] == "Outfit"


def test_patch_changes_item_ids(client: TestClient) -> None:
    user = _create_user()
    item_a = _create_item(user.id, "A")
    item_b = _create_item(user.id, "B")
    created = client.post(
        "/api/outfits",
        json={"name": "Alt", "item_ids": [item_a.id]},
        headers=_auth(user.id),
    ).json()
    response = client.patch(
        f"/api/outfits/{created['id']}",
        json={"name": "Neu", "item_ids": [item_b.id]},
        headers=_auth(user.id),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Neu"
    assert body["item_ids"] == [item_b.id]


def test_delete_outfit(client: TestClient) -> None:
    user = _create_user()
    item = _create_item(user.id)
    created = client.post(
        "/api/outfits",
        json={"name": "Zu löschen", "item_ids": [item.id]},
        headers=_auth(user.id),
    ).json()
    response = client.delete(f"/api/outfits/{created['id']}", headers=_auth(user.id))
    assert response.status_code == 204
    assert client.get(f"/api/outfits/{created['id']}", headers=_auth(user.id)).status_code == 404


def test_foreign_outfit_id_returns_404(client: TestClient) -> None:
    user_a = _create_user("a@example.com")
    user_b = _create_user("b@example.com")
    item_b = _create_item(user_b.id)
    foreign = client.post(
        "/api/outfits",
        json={"name": "Fremd", "item_ids": [item_b.id]},
        headers=_auth(user_b.id),
    ).json()
    assert client.get(f"/api/outfits/{foreign['id']}", headers=_auth(user_a.id)).status_code == 404
    assert (
        client.patch(
            f"/api/outfits/{foreign['id']}",
            json={"name": "X", "item_ids": []},
            headers=_auth(user_a.id),
        ).status_code
        == 404
    )
    assert (
        client.delete(f"/api/outfits/{foreign['id']}", headers=_auth(user_a.id)).status_code == 404
    )


def test_missing_outfit_id_returns_404(client: TestClient) -> None:
    user = _create_user()
    assert client.get("/api/outfits/9999", headers=_auth(user.id)).status_code == 404


def test_foreign_item_id_returns_404(client: TestClient) -> None:
    user_a = _create_user("a@example.com")
    user_b = _create_user("b@example.com")
    item_b = _create_item(user_b.id)
    response = client.post(
        "/api/outfits",
        json={"name": "Mit fremdem Item", "item_ids": [item_b.id]},
        headers=_auth(user_a.id),
    )
    assert response.status_code == 404


def test_unauthenticated_returns_401(client: TestClient) -> None:
    assert client.get("/api/outfits").status_code == 401
    assert client.post("/api/outfits", json={"name": "X", "item_ids": []}).status_code == 401
