from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..session import Base

class Post(Base):
    __tablename__ = "posts"
    __table_args__ = (
        Index('ix_posts_user_created', 'user_id', 'created_at'),
        Index('ix_posts_created', 'created_at'),
        Index('ix_posts_unique_id', 'unique_id'),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, default="")
    media_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    unique_id: Mapped[str] = mapped_column(String(10), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    author: Mapped["User"] = relationship("User", back_populates="posts")
