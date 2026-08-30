"""Central configuration.

Values are read lazily (never at import time) so a missing variable cannot
crash the process before it can serve anything. Non-secret values have a safe
dev default; secrets have no committed value and are generated per run.
"""

import os
import secrets

# Default database location resolves to ``backend/wardrobe.db`` when the
# process runs from the ``backend/`` directory (as declared in RUN.json).
DEFAULT_DATABASE_URL = "sqlite:///./wardrobe.db"
DEFAULT_CORS_ORIGIN = "http://localhost:5173"

_jwt_secret: str | None = None


def get_database_url() -> str:
    """Return the SQLAlchemy database URL, with a runnable SQLite default."""
    raw = os.environ.get("DATABASE_URL", DEFAULT_DATABASE_URL)
    if raw.startswith("sqlite"):
        return raw
    # Tolerate a bare file path (e.g. "backend/wardrobe.db") by prefixing the
    # SQLite scheme so SQLAlchemy accepts it.
    return "sqlite:///" + raw.lstrip("/")


def get_jwt_secret() -> str:
    """Return the JWT signing secret, generated once per run when not provided."""
    global _jwt_secret
    if _jwt_secret is None:
        _jwt_secret = os.environ.get("JWT_SECRET") or secrets.token_hex(32)
    return _jwt_secret


def get_cors_origin() -> str:
    """Return the single allowed CORS origin."""
    return os.environ.get("CORS_ORIGIN", DEFAULT_CORS_ORIGIN)


def validate_config() -> None:
    """Touch every configuration value once so a bad config fails at startup."""
    get_database_url()
    get_jwt_secret()
    get_cors_origin()
