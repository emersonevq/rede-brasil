from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import asyncio

from database.session import get_db
from dependencies import get_current_user
from database.models import User, Visit, FriendRequest, Friendship
from schemas.visit import VisitOut, VisitorInfo, VisitCreate
from core.websocket import emit_visit_notification

router = APIRouter()

@router.post("/", response_model=VisitOut)
def record_visit(payload: VisitCreate, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    visited_user_id = payload.visited_user_id
    if visited_user_id == current.id:
        raise HTTPException(status_code=400, detail="Não é possível visitar seu próprio perfil")

    target = db.query(User).filter(User.id == visited_user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    visit = Visit(visitor_id=current.id, visited_user_id=visited_user_id, visited_at=datetime.utcnow())
    db.add(visit)
    db.commit()
    db.refresh(visit)

    # Emit websocket notification
    asyncio.create_task(
        emit_visit_notification(
            visited_user_id=visited_user_id,
            visitor_id=current.id,
            visitor_name=f"{current.first_name} {current.last_name}".strip() or current.username,
            visitor_avatar=current.profile_photo
        )
    )

    return visit

@router.get("/profile/{user_id}", response_model=List[VisitorInfo])
def get_profile_visits(
    user_id: int, 
    current: User = Depends(get_current_user), 
    db: Session = Depends(get_db),
    time_filter: str = Query("all", description="Filter: all, today, week, month")
):
    if user_id != current.id:
        raise HTTPException(status_code=403, detail="Você só pode ver visitantes do seu próprio perfil")

    query = db.query(Visit).filter(Visit.visited_user_id == current.id)

    if time_filter == "today":
        today = datetime.utcnow().date()
        query = query.filter(Visit.visited_at >= datetime.combine(today, datetime.min.time()))
    elif time_filter == "week":
        one_week_ago = datetime.utcnow() - timedelta(days=7)
        query = query.filter(Visit.visited_at >= one_week_ago)
    elif time_filter == "month":
        one_month_ago = datetime.utcnow() - timedelta(days=30)
        query = query.filter(Visit.visited_at >= one_month_ago)

    visits = query.order_by(Visit.visited_at.desc()).all()

    result = []
    for visit in visits:
        visitor = db.query(User).filter(User.id == visit.visitor_id).first()
        if visitor:
            is_friend = db.query(Friendship).filter(
                Friendship.user_id == current.id,
                Friendship.friend_id == visit.visitor_id
            ).first() is not None

            has_sent_friend_request = db.query(FriendRequest).filter(
                FriendRequest.sender_id == current.id,
                FriendRequest.receiver_id == visit.visitor_id,
                FriendRequest.status == "pending"
            ).first() is not None

            result.append(VisitorInfo(
                id=visit.id,
                visitor_id=visitor.id,
                visitor_name=f"{visitor.first_name} {visitor.last_name}".strip() or visitor.username,
                visitor_profile_photo=visitor.profile_photo,
                visited_at=visit.visited_at,
                is_friend=is_friend,
                has_sent_friend_request=has_sent_friend_request
            ))

    return result

@router.get("/count/{user_id}", response_model=dict)
def get_visit_count(
    user_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_id != current.id:
        raise HTTPException(status_code=403, detail="Você só pode contar visitantes do seu próprio perfil")

    count = db.query(Visit).filter(Visit.visited_user_id == current.id).count()

    today_count = db.query(Visit).filter(
        Visit.visited_user_id == current.id,
        Visit.visited_at >= datetime.combine(datetime.utcnow().date(), datetime.min.time())
    ).count()

    return {"total_visits": count, "today_visits": today_count}

@router.get("/unread-count", response_model=dict)
def get_unread_visits_count(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    one_day_ago = datetime.utcnow() - timedelta(days=1)
    count = db.query(Visit).filter(
        Visit.visited_user_id == current.id,
        Visit.visited_at >= one_day_ago
    ).count()

    return {"unread_visits": count}
