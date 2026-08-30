"""Health endpoint and app start/import checks for the backend skeleton."""

from fastapi.testclient import TestClient

from app.main import app


def test_app_imports() -> None:
    assert app is not None


def test_health_returns_ok() -> None:
    with TestClient(app) as client:
        response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_is_reachable_after_startup() -> None:
    # The context-manager form runs the lifespan (create_all + config validation).
    with TestClient(app) as client:
        assert client.get("/api/health").status_code == 200


def test_cors_allows_frontend_origin_with_credentials() -> None:
    with TestClient(app) as client:
        response = client.options(
            "/api/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
        )
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert response.headers.get("access-control-allow-credentials") == "true"
