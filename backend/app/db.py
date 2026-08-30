"""Database engine, session factory and declarative base."""

from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import get_database_url

_database_url = get_database_url()

# Make sure a file-backed SQLite database has a directory to live in.
if _database_url.startswith("sqlite:///"):
    _path = _database_url[len("sqlite:///") :]
    if _path and _path != ":memory:" and not _path.startswith("file:"):
        _parent = Path(_path).parent
        if str(_parent) not in ("", "."):
            _parent.mkdir(parents=True, exist_ok=True)

_connect_args = {"check_same_thread": False} if _database_url.startswith("sqlite") else {}

engine = create_engine(_database_url, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
