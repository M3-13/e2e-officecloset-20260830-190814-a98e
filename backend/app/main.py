"""FastAPI application entry point: wires routers, CORS, static uploads and health."""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .auth import router as auth_router
from .config import get_cors_origin, get_database_url, get_jwt_secret, validate_config
from .db import Base, engine
from .outfits import router as outfits_router
from .storage import UPLOAD_DIR
from .wardrobe import router as wardrobe_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_config()
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Glamouröser Kleiderschrank-Manager", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[get_cors_origin()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(wardrobe_router)
app.include_router(outfits_router)

# Create the upload directory before the static mount so a fresh clone can import.
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@app.get("/api/health")
def health() -> dict[str, str]:
    get_jwt_secret()
    get_database_url()
    return {"status": "ok"}
