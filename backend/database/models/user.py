from datetime import datetime
from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..session import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    profile_photo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cover_photo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    posts: Mapped[list["Post"]] = relationship("Post", back_populates="author", cascade="all,delete-orphan")
    stories: Mapped[list["Story"]] = relationship("Story", back_populates="author", cascade="all,delete-orphan")
    highlights: Mapped[list["Highlight"]] = relationship("Highlight", back_populates="author", cascade="all,delete-orphan")

    # Profile relations
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all,delete-orphan")
    positions = relationship("UserPosition", back_populates="user", cascade="all,delete-orphan")
    education = relationship("UserEducation", back_populates="user", cascade="all,delete-orphan")
