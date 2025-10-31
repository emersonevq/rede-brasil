from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database.session import get_db
from dependencies import get_current_user
from database.models import User, FriendRequest, Friendship, UserProfile
from schemas.friend import FriendRequestCreate, FriendRequestOut, FriendStatusOut, IncomingFriendRequestOut
from core.websocket import emit_friend_request_notification, emit_friend_request_accepted

router = APIRouter()

@router.post("/requests", response_model=FriendRequestOut)
async def send_request(payload: FriendRequestCreate, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.user_id == current.id:
        raise HTTPException(status_code=400, detail="Não é possível enviar convite para si mesmo")

    target = db.query(User).filter(User.id == payload.user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # Already friends?
    existing_friend = db.query(Friendship).filter(Friendship.user_id == current.id, Friendship.friend_id == target.id).first()
    if existing_friend:
        raise HTTPException(status_code=400, detail="Vocês já são amigos")

    # Pending request exists in either direction?
    pending = db.query(FriendRequest).filter(
        FriendRequest.status == "pending",
        ((FriendRequest.sender_id == current.id) & (FriendRequest.receiver_id == target.id)) |
        ((FriendRequest.sender_id == target.id) & (FriendRequest.receiver_id == current.id))
    ).first()
    if pending:
        raise HTTPException(status_code=400, detail="Já existe um convite pendente")

    fr = FriendRequest(sender_id=current.id, receiver_id=target.id, status="pending", created_at=datetime.utcnow(), updated_at=datetime.utcnow())
    db.add(fr)
    db.commit()
    db.refresh(fr)

    try:
        await emit_friend_request_notification(
            receiver_id=target.id,
            sender_id=current.id,
            sender_name=f"{current.first_name} {current.last_name}".strip() or current.username,
            sender_avatar=current.profile_photo
        )
    except Exception as e:
        import logging
        logging.warning(f"Failed to emit friend request notification: {str(e)}")

    return fr

@router.get("/requests/incoming", response_model=List[IncomingFriendRequestOut])
def get_incoming_requests(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    requests = db.query(FriendRequest).filter(
        FriendRequest.receiver_id == current.id,
        FriendRequest.status == "pending",
    ).order_by(FriendRequest.created_at.desc()).all()

    result = []
    for req in requests:
        sender = db.query(User).filter(User.id == req.sender_id).first()
        if sender:
            result.append(IncomingFriendRequestOut(
                id=req.id,
                sender_id=sender.id,
                sender_name=f"{sender.first_name} {sender.last_name}".strip() or sender.username,
                sender_profile_photo=sender.profile_photo,
                created_at=req.created_at,
            ))
    return result

@router.get("/status/{user_id}", response_model=FriendStatusOut)
def get_status(user_id: int, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_id == current.id:
        return FriendStatusOut(status="friends", request_id=None)

    # friends?
    f = db.query(Friendship).filter(Friendship.user_id == current.id, Friendship.friend_id == user_id).first()
    if f:
        return FriendStatusOut(status="friends", request_id=None)

    # pending outgoing
    out_req = db.query(FriendRequest).filter(
        FriendRequest.sender_id == current.id,
        FriendRequest.receiver_id == user_id,
        FriendRequest.status == "pending",
    ).first()
    if out_req:
        return FriendStatusOut(status="outgoing_pending", request_id=out_req.id)

    # pending incoming
    in_req = db.query(FriendRequest).filter(
        FriendRequest.sender_id == user_id,
        FriendRequest.receiver_id == current.id,
        FriendRequest.status == "pending",
    ).first()
    if in_req:
        return FriendStatusOut(status="incoming_pending", request_id=in_req.id)

    return FriendStatusOut(status="none", request_id=None)

@router.post("/requests/{request_id}/accept", response_model=FriendRequestOut)
async def accept_request(request_id: int, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(FriendRequest).filter(FriendRequest.id == request_id).first()
    if not req or req.status != "pending":
        raise HTTPException(status_code=404, detail="Convite não encontrado")
    if req.receiver_id != current.id:
        raise HTTPException(status_code=403, detail="Sem permissão para aceitar este convite")

    # create friendships both directions
    exists = db.query(Friendship).filter(Friendship.user_id == req.sender_id, Friendship.friend_id == req.receiver_id).first()
    if not exists:
        db.add(Friendship(user_id=req.sender_id, friend_id=req.receiver_id))
    exists_rev = db.query(Friendship).filter(Friendship.user_id == req.receiver_id, Friendship.friend_id == req.sender_id).first()
    if not exists_rev:
        db.add(Friendship(user_id=req.receiver_id, friend_id=req.sender_id))

    # update request
    req.status = "accepted"
    req.updated_at = datetime.utcnow()

    # update profiles connection counts
    for uid in [req.sender_id, req.receiver_id]:
        prof = db.query(UserProfile).filter(UserProfile.user_id == uid).first()
        if not prof:
            prof = UserProfile(user_id=uid, connections_count=1)
            db.add(prof)
        else:
            prof.connections_count = (prof.connections_count or 0) + 1
            db.add(prof)

    db.commit()
    db.refresh(req)

    # Get sender info for notification
    sender = db.query(User).filter(User.id == req.sender_id).first()

    # Emit websocket notification to the request sender
    if sender:
        try:
            await emit_friend_request_accepted(
                requester_id=req.sender_id,
                accepter_id=current.id,
                accepter_name=f"{current.first_name} {current.last_name}".strip() or current.username,
                accepter_avatar=current.profile_photo
            )
        except Exception as e:
            import logging
            logging.warning(f"Failed to emit friend request accepted notification: {str(e)}")

    return req

@router.post("/requests/{request_id}/decline", response_model=FriendRequestOut)
def decline_request(request_id: int, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(FriendRequest).filter(FriendRequest.id == request_id).first()
    if not req or req.status != "pending":
        raise HTTPException(status_code=404, detail="Convite não encontrado")
    if req.receiver_id != current.id:
        raise HTTPException(status_code=403, detail="Sem permissão para recusar este convite")
    req.status = "declined"
    req.updated_at = datetime.utcnow()
    db.add(req)
    db.commit()
    db.refresh(req)
    return req

@router.delete("/requests/{request_id}")
def cancel_request(request_id: int, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(FriendRequest).filter(FriendRequest.id == request_id).first()
    if not req or req.status != "pending":
        raise HTTPException(status_code=404, detail="Convite não encontrado")
    if req.sender_id != current.id:
        raise HTTPException(status_code=403, detail="Sem permissão para cancelar este convite")
    req.status = "canceled"
    req.updated_at = datetime.utcnow()
    db.add(req)
    db.commit()
    return {"success": True}
