from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from database.session import get_db
from dependencies import get_current_user
from database.models import User, Notification
from schemas.notification import NotificationOut, NotificationResponse

router = APIRouter()

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    unread_only: bool = False
):
    query = db.query(Notification).filter(Notification.user_id == current.id)
    
    if unread_only:
        query = query.filter(Notification.read == False)
    
    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
    return notifications

@router.get("/unread-count", response_model=dict)
def get_unread_count(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = db.query(Notification).filter(
        Notification.user_id == current.id,
        Notification.read == False
    ).count()
    return {"unread_count": count}

@router.post("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    notification.read = True
    db.commit()
    return {"success": True}

@router.post("/read-all")
def mark_all_as_read(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.user_id == current.id,
        Notification.read == False
    ).update({"read": True})
    db.commit()
    return {"success": True}

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    db.delete(notification)
    db.commit()
    return {"success": True}
