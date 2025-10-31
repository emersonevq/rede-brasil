from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Any

class NotificationOut(BaseModel):
    id: int
    type: str
    data: Optional[Any] = None
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationResponse(NotificationOut):
    pass

class NotificationCreate(BaseModel):
    type: str
    actor_id: Optional[int] = None
    related_id: Optional[int] = None
    data: Optional[dict] = None
