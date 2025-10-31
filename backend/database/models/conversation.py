from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey, Table, Column, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..session import Base

# Association table for many-to-many relationship between users and conversations
conversation_participants = Table(
    'conversation_participants',
    Base.metadata,
    Column('conversation_id', Integer, ForeignKey('conversations.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('muted', Boolean, default=False),
    Column('deleted_at', DateTime, nullable=True),
)

class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_group: Mapped[bool] = mapped_column(default=False, index=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_by_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, index=True)

    participants: Mapped[list["User"]] = relationship(
        "User",
        secondary=conversation_participants,
        backref="conversations"
    )
    messages: Mapped[list["Message"]] = relationship(
        "Message",
        back_populates="conversation",
        cascade="all,delete-orphan"
    )
    creator = relationship("User", foreign_keys=[created_by_id])
