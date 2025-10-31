from __future__ import annotations
from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..session import Base

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)

    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    hometown: Mapped[str | None] = mapped_column(String(100), nullable=True)
    current_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    relationship_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    workplace_company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    workplace_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    connections_count: Mapped[int] = mapped_column(Integer, default=0)

    show_hometown: Mapped[bool] = mapped_column(Boolean, default=True)
    show_current_city: Mapped[bool] = mapped_column(Boolean, default=True)
    show_relationship_status: Mapped[bool] = mapped_column(Boolean, default=True)
    show_contact_email: Mapped[bool] = mapped_column(Boolean, default=False)
    show_contact_phone: Mapped[bool] = mapped_column(Boolean, default=False)
    show_workplace: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")

class UserPosition(Base):
    __tablename__ = "user_positions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    company: Mapped[str] = mapped_column(String(255))
    title: Mapped[str] = mapped_column(String(255))
    start: Mapped[str] = mapped_column(String(50))
    end: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="positions")

class UserEducation(Base):
    __tablename__ = "user_education"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    institution: Mapped[str] = mapped_column(String(255))
    degree: Mapped[str] = mapped_column(String(255))
    start: Mapped[str] = mapped_column(String(50))
    end: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="education")
