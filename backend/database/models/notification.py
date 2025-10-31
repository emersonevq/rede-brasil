from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from database.session import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    related_id = Column(Integer, nullable=True)
    data = Column(JSON, nullable=True)
    read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index('ix_notifications_user_read', 'user_id', 'read'),
        Index('ix_notifications_user_created', 'user_id', 'created_at'),
    )

    user = relationship("User", foreign_keys=[user_id], backref="notifications_received")
    actor = relationship("User", foreign_keys=[actor_id])
