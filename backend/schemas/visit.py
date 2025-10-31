from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class VisitCreate(BaseModel):
    visited_user_id: int

class VisitOut(BaseModel):
    id: int
    visitor_id: int
    visited_user_id: int
    visited_at: datetime

    class Config:
        from_attributes = True

class VisitorInfo(BaseModel):
    id: int
    visitor_id: int
    visitor_name: str
    visitor_profile_photo: Optional[str] = None
    visited_at: datetime
    is_friend: bool = False
    has_sent_friend_request: bool = False

    class Config:
        from_attributes = True
