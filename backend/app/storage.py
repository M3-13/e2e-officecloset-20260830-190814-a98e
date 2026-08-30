"""File storage for uploaded clothing images under ``backend/uploads``."""

import os
import uuid

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")


def save_image(data: bytes, filename: str) -> str:
    """Persist image bytes and return the public path ``/uploads/<stored_name>``."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(filename or "")[1].lower() or ".bin"
    stored = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(UPLOAD_DIR, stored), "wb") as fh:
        fh.write(data)
    return f"/uploads/{stored}"


def delete_image(image_url: str | None) -> None:
    """Delete the stored file behind an ``/uploads/<name>`` path, if any."""
    if not image_url:
        return
    filename = image_url.rsplit("/", 1)[-1]
    path = os.path.join(UPLOAD_DIR, filename)
    if os.path.isfile(path):
        os.remove(path)
