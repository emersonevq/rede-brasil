from datetime import datetime
from pydantic import BaseModel

class HighlightCreate(BaseModel):
    name: str
    cover: str
    photos: list[str]

class HighlightUpdate(BaseModel):
    name: str | None = None
    cover: str | None = None
    photos: list[str] | None = None

class HighlightOut(BaseModel):
    id: int
    name: str
    cover: str
    photos: list[str]
    created_at: datetime

    class Config:
        from_attributes = True
