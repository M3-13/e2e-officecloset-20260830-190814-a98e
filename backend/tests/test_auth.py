"""Tests for the authentication ticket: register, login, /me, rate limiting and
account deletion."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.auth import get_db, reset_rate_limits
from app.db import Base
from app.main import app
from app.models import Item, Outfit, User


@pytest.fixture
def engine(tmp_path):
    engine = create_engine(
        f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(engine)
    return engine


@pytest.fixture
def client(engine):
    session_factory = sessionmaker(bind=engine)

    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    reset_rate_limits()
    yield TestClient(app)
    app.dependency_overrides.clear()


def _register(client, email="user@example.com", password="secret"):
    return client.post("/api/auth/register", json={"email": email, "password": password})


def test_register_returns_201_and_token(client):
    response = _register(client)
    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_register_hashes_password_with_argon2(client, engine):
    _register(client, email="hash@example.com")
    session_factory = sessionmaker(bind=engine)
    with session_factory() as db:
        user = db.query(User).filter(User.email == "hash@example.com").first()
    assert user is not None
    assert user.hashed_password != "secret"
    assert user.hashed_password.startswith("$argon2id$")


def test_register_duplicate_returns_409(client):
    assert _register(client, email="dup@example.com").status_code == 201
    assert _register(client, email="dup@example.com").status_code == 409


def test_login_returns_200_and_token(client):
    _register(client, email="login@example.com", password="correct")
    response = client.post(
        "/api/auth/login", json={"email": "login@example.com", "password": "correct"}
    )
    assert response.status_code == 200
    assert response.json()["access_token"]


def test_login_wrong_password_returns_401(client):
    _register(client, email="bad@example.com", password="right")
    response = client.post(
        "/api/auth/login", json={"email": "bad@example.com", "password": "wrong"}
    )
    assert response.status_code == 401


def test_me_with_token(client):
    token = _register(client, email="me@example.com").json()["access_token"]
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"


def test_me_without_token_returns_401(client):
    assert client.get("/api/auth/me").status_code == 401


def test_register_rate_limited(client):
    for i in range(5):
        assert _register(client, email=f"rl{i}@example.com").status_code == 201
    assert _register(client, email="rl6@example.com").status_code == 429


def test_delete_account_removes_user_and_data(client, engine):
    token = _register(client, email="del@example.com").json()["access_token"]

    session_factory = sessionmaker(bind=engine)
    with session_factory() as db:
        user = db.query(User).filter(User.email == "del@example.com").first()
        user_id = user.id
        db.add(Item(name="Shirt", category="Tops", owner_id=user_id))
        db.add(Outfit(name="Casual", owner_id=user_id))
        db.commit()

    response = client.delete("/api/auth/account", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 204

    with session_factory() as db:
        assert db.query(User).filter(User.id == user_id).first() is None
        assert db.query(Item).filter(Item.owner_id == user_id).first() is None
        assert db.query(Outfit).filter(Outfit.owner_id == user_id).first() is None


def test_delete_account_removes_uploaded_image(client, engine, tmp_path, monkeypatch):
    import app.storage as storage_mod

    monkeypatch.setattr(storage_mod, "UPLOAD_DIR", str(tmp_path))
    image_file = tmp_path / "abc.png"
    image_file.write_bytes(b"png")

    token = _register(client, email="img@example.com").json()["access_token"]

    session_factory = sessionmaker(bind=engine)
    with session_factory() as db:
        user = db.query(User).filter(User.email == "img@example.com").first()
        db.add(Item(name="Shirt", category="Tops", image_url="/uploads/abc.png", owner_id=user.id))
        db.commit()

    response = client.delete("/api/auth/account", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 204
    assert not image_file.exists()
