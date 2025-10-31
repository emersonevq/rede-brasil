from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey, Text, Boolean, Table, Column, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..session import Base

# Association table for tracking which users have read each message
message_reads = Table(
    'message_reads',
    Base.metadata,
    Column('message_id', Integer, ForeignKey('messages.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('read_at', DateTime, default=datetime.utcnow),
)

class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (
        Index('ix_messages_conversation_created', 'conversation_id', 'created_at'),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    conversation_id: Mapped[int] = mapped_column(Integer, ForeignKey("conversations.id"), nullable=False, index=True)
    sender_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_type: Mapped[str] = mapped_column(String(50), default="text")  # text, image, audio, gif, file
    media_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(default=False, index=True)
    edited_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])
    read_by: Mapped[list["User"]] = relationship(
        "User",
        secondary=message_reads,
        backref="read_messages"
    )
