"""Tests for the wardrobe (clothing item) CRUD with image upload and ownership."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import wardrobe
from app.db import Base
from app.main import app
from app.models import User
from app.security import create_access_token

MAX_UPLOAD_SIZE = 5 * 1024 * 1024


@pytest.fixture()
def client() -> TestClient:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    testing_session = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    def override_get_db():
        db = testing_session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[wardrobe.get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def _create_user(client: TestClient, email: str) -> tuple[int, dict[str, str]]:
    gen = client.app.dependency_overrides[wardrobe.get_db]()
    session = next(gen)
    try:
        user = User(email=email, hashed_password="x")
        session.add(user)
        session.commit()
        session.refresh(user)
        user_id = user.id
    finally:
        gen.close()
    token = create_access_token(user_id)
    return user_id, {"Authorization": f"Bearer {token}"}


def _image_bytes() -> bytes:
    return b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


def test_create_item_with_image(client: TestClient) -> None:
    _, headers = _create_user(client, "owner@example.com")
    resp = client.post(
        "/api/wardrobe/items",
        data={"name": "Hemd", "category": "Oberteil", "color": "blau"},
        files={"image": ("hemd.png", _image_bytes(), "image/png")},
        headers=headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Hemd"
    assert body["image_url"].startswith("/uploads/")


def test_list_only_own_items(client: TestClient) -> None:
    _, headers = _create_user(client, "owner@example.com")
    _, other_headers = _create_user(client, "other@example.com")

    client.post(
        "/api/wardrobe/items",
        data={"name": "Meins", "category": "Oberteil"},
        headers=headers,
    )
    client.post(
        "/api/wardrobe/items",
        data={"name": "Seins", "category": "Oberteil"},
        headers=other_headers,
    )

    resp = client.get("/api/wardrobe/items", headers=headers)
    assert resp.status_code == 200
    names = [item["name"] for item in resp.json()]
    assert names == ["Meins"]


def test_filter_by_category(client: TestClient) -> None:
    _, headers = _create_user(client, "owner@example.com")
    client.post(
        "/api/wardrobe/items",
        data={"name": "Hemd", "category": "Oberteil"},
        headers=headers,
    )
    client.post(
        "/api/wardrobe/items",
        data={"name": "Jeans", "category": "Hose"},
        headers=headers,
    )

    resp = client.get("/api/wardrobe/items", params={"category": "Hose"}, headers=headers)
    assert resp.status_code == 200
    names = [item["name"] for item in resp.json()]
    assert names == ["Jeans"]


def test_update_item(client: TestClient) -> None:
    _, headers = _create_user(client, "owner@example.com")
    created = client.post(
        "/api/wardrobe/items",
        data={"name": "Hemd", "category": "Oberteil"},
        headers=headers,
    ).json()

    resp = client.patch(
        f"/api/wardrobe/items/{created['id']}",
        data={"name": "Bluse", "category": "Oberteil", "color": "rot"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Bluse"
    assert resp.json()["color"] == "rot"


def test_delete_item(client: TestClient) -> None:
    _, headers = _create_user(client, "owner@example.com")
    created = client.post(
        "/api/wardrobe/items",
        data={"name": "Hemd", "category": "Oberteil"},
        headers=headers,
    ).json()

    resp = client.delete(f"/api/wardrobe/items/{created['id']}", headers=headers)
    assert resp.status_code == 204

    get_resp = client.get(f"/api/wardrobe/items/{created['id']}", headers=headers)
    assert get_resp.status_code == 404


def test_foreign_id_returns_404(client: TestClient) -> None:
    _, owner_headers = _create_user(client, "owner@example.com")
    _, other_headers = _create_user(client, "other@example.com")
    created = client.post(
        "/api/wardrobe/items",
        data={"name": "Meins", "category": "Oberteil"},
        headers=owner_headers,
    ).json()

    for method in ("get", "patch", "delete"):
        if method == "get":
            resp = client.get(f"/api/wardrobe/items/{created['id']}", headers=other_headers)
        elif method == "patch":
            resp = client.patch(
                f"/api/wardrobe/items/{created['id']}",
                data={"name": "X", "category": "Oberteil"},
                headers=other_headers,
            )
        else:
            resp = client.delete(f"/api/wardrobe/items/{created['id']}", headers=other_headers)
        assert resp.status_code == 404


def test_missing_id_returns_404(client: TestClient) -> None:
    _, headers = _create_user(client, "owner@example.com")
    assert client.get("/api/wardrobe/items/9999", headers=headers).status_code == 404


def test_upload_too_large_returns_413(client: TestClient) -> None:
    _, headers = _create_user(client, "owner@example.com")
    big = b"\x00" * (MAX_UPLOAD_SIZE + 1024)
    resp = client.post(
        "/api/wardrobe/items",
        data={"name": "Groß", "category": "Oberteil"},
        files={"image": ("big.png", big, "image/png")},
        headers=headers,
    )
    assert resp.status_code == 413


def test_wrong_image_type_rejected(client: TestClient) -> None:
    _, headers = _create_user(client, "owner@example.com")
    resp = client.post(
        "/api/wardrobe/items",
        data={"name": "Falsch", "category": "Oberteil"},
        files={"image": ("note.txt", b"hello", "text/plain")},
        headers=headers,
    )
    assert resp.status_code == 400


def test_unauthenticated_returns_401(client: TestClient) -> None:
    assert client.get("/api/wardrobe/items").status_code == 401
