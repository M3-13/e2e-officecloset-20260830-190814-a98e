"""Pydantic request/response schemas shared across the API."""

from pydantic import BaseModel, ConfigDict, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str


class ItemBase(BaseModel):
    name: str
    category: str
    color: str | None = None
    season: str | None = None


class ItemCreate(ItemBase):
    pass


class ItemUpdate(ItemBase):
    pass


class ItemOut(ItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_url: str | None = None


class OutfitBase(BaseModel):
    name: str
    item_ids: list[int] = Field(default_factory=list)


class OutfitCreate(OutfitBase):
    pass


class OutfitUpdate(OutfitBase):
    pass


class OutfitOut(OutfitBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
