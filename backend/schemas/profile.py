from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import List, Optional

class Position(BaseModel):
    company: str
    title: str
    start: str
    end: Optional[str] = None

class Education(BaseModel):
    institution: str
    degree: str
    start: str
    end: Optional[str] = None

class ProfileBase(BaseModel):
    bio: Optional[str] = None
    hometown: Optional[str] = None
    current_city: Optional[str] = None
    relationship_status: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    workplace_company: Optional[str] = None
    workplace_title: Optional[str] = None
    connections_count: int = 0

    show_hometown: bool = True
    show_current_city: bool = True
    show_relationship_status: bool = True
    show_contact_email: bool = False
    show_contact_phone: bool = False
    show_workplace: bool = True

    positions: List[Position] = []
    education: List[Education] = []

class ProfileOut(ProfileBase):
    id: int | None = None
    user_id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True

class ProfileUpdate(ProfileBase):
    pass
