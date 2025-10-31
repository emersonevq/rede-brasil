from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query, Form
from sqlalchemy.orm import Session
from database.session import get_db
from schemas.user import UserBase
from schemas.post import PostOut
from schemas.profile import ProfileOut, ProfileUpdate
from dependencies import get_current_user
from database.models import User, Post, UserProfile, UserPosition, UserEducation
import os
import uuid
from pathlib import Path
from typing import List

router = APIRouter()

MEDIA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "media")
os.makedirs(MEDIA_DIR, exist_ok=True)

@router.get("/me", response_model=UserBase)
async def me(current: User = Depends(get_current_user)):
    return current

@router.get("/search")
async def search_users(q: str = Query(""), db: Session = Depends(get_db)):
    term = (q or "").strip()
    qs = db.query(User)
    if term:
        like = f"%{term.lower()}%"
        qs = qs.filter((User.first_name.ilike(like)) | (User.last_name.ilike(like)) | (User.email.ilike(like)))
    users = qs.order_by(User.first_name.asc()).limit(20).all()
    def to_username(u: User):
        return f"{u.first_name}{u.last_name}".replace(" ", "").lower()
    return [
        {
            "id": u.id,
            "name": f"{u.first_name} {u.last_name}",
            "username": to_username(u),
            "profile_photo": u.profile_photo,
            "cover_photo": u.cover_photo,
        }
        for u in users
    ]

@router.get("/{user_id}", response_model=UserBase)
async def get_user(user_id: str, db: Session = Depends(get_db)):
    user = None
    if user_id.isdigit():
        user = db.query(User).filter(User.id == int(user_id)).first()
    else:
        user = db.query(User).filter(User.username == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

@router.get("/{user_id}/posts", response_model=List[PostOut])
async def get_user_posts(user_id: str, db: Session = Depends(get_db)):
    user = None
    if user_id.isdigit():
        user = db.query(User).filter(User.id == int(user_id)).first()
    else:
        user = db.query(User).filter(User.username == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    posts = db.query(Post).filter(Post.user_id == user.id).order_by(Post.created_at.desc()).all()
    return [
        PostOut(
            id=p.id,
            content=p.content,
            media_url=p.media_url,
            created_at=p.created_at,
            user_id=p.user_id,
            user_name=f"{p.author.first_name} {p.author.last_name}" if p.author else "Anônimo",
            user_profile_photo=p.author.profile_photo if p.author else None,
            user_cover_photo=p.author.cover_photo if p.author else None,
        ) for p in posts
    ]

@router.post("/profile-photo")
async def update_profile_photo(
    file: UploadFile = File(...),
    caption: str = Form(""),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        file_extension = Path(file.filename or "jpg").suffix
        unique_filename = f"profile_{current.id}_{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(MEDIA_DIR, unique_filename)

        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        media_url = f"/media/{unique_filename}"
        current.profile_photo = media_url
        db.add(current)
        db.commit()
        db.refresh(current)

        return {
            "success": True,
            "profile_photo": media_url,
            "message": "Profile photo updated successfully",
        }
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error uploading profile photo: {str(e)}")

@router.post("/cover-photo")
async def update_cover_photo(
    file: UploadFile = File(...),
    caption: str = Form(""),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        file_extension = Path(file.filename or "jpg").suffix
        unique_filename = f"cover_{current.id}_{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(MEDIA_DIR, unique_filename)

        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        media_url = f"/media/{unique_filename}"
        current.cover_photo = media_url
        db.add(current)
        db.commit()
        db.refresh(current)

        return {
            "success": True,
            "cover_photo": media_url,
            "message": "Cover photo updated successfully",
        }
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error uploading cover photo: {str(e)}")

@router.get("/me/profile", response_model=ProfileOut)
async def get_my_profile(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prof = db.query(UserProfile).filter(UserProfile.user_id == current.id).first()
    positions = db.query(UserPosition).filter(UserPosition.user_id == current.id).all()
    education = db.query(UserEducation).filter(UserEducation.user_id == current.id).all()

    if not prof:
        return ProfileOut(
            id=None,
            user_id=current.id,
            bio=None,
            hometown=None,
            current_city=None,
            relationship_status=None,
            contact_email=current.email,
            contact_phone=None,
            workplace_company=None,
            workplace_title=None,
            connections_count=0,
            show_hometown=True,
            show_current_city=True,
            show_relationship_status=True,
            show_contact_email=False,
            show_contact_phone=False,
            show_workplace=True,
            positions=[],
            education=[],
            created_at=None,
            updated_at=None,
        )

    return ProfileOut(
        id=prof.id,
        user_id=current.id,
        bio=prof.bio,
        hometown=prof.hometown,
        current_city=prof.current_city,
        relationship_status=prof.relationship_status,
        contact_email=prof.contact_email,
        contact_phone=prof.contact_phone,
        workplace_company=prof.workplace_company,
        workplace_title=prof.workplace_title,
        connections_count=prof.connections_count or 0,
        show_hometown=prof.show_hometown,
        show_current_city=prof.show_current_city,
        show_relationship_status=prof.show_relationship_status,
        show_contact_email=prof.show_contact_email,
        show_contact_phone=prof.show_contact_phone,
        show_workplace=prof.show_workplace,
        positions=[
            {"company": p.company, "title": p.title, "start": p.start, "end": p.end}
            for p in positions
        ],
        education=[
            {"institution": e.institution, "degree": e.degree, "start": e.start, "end": e.end}
            for e in education
        ],
        created_at=prof.created_at,
        updated_at=prof.updated_at,
    )

@router.put("/me/profile", response_model=ProfileOut)
async def update_my_profile(
    payload: ProfileUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prof = db.query(UserProfile).filter(UserProfile.user_id == current.id).first()
    if not prof:
        prof = UserProfile(user_id=current.id)
        db.add(prof)

    prof.bio = payload.bio
    prof.hometown = payload.hometown
    prof.current_city = payload.current_city
    prof.relationship_status = payload.relationship_status
    prof.contact_email = payload.contact_email or current.email
    prof.contact_phone = payload.contact_phone
    prof.workplace_company = payload.workplace_company
    prof.workplace_title = payload.workplace_title
    prof.connections_count = payload.connections_count or 0
    prof.show_hometown = payload.show_hometown
    prof.show_current_city = payload.show_current_city
    prof.show_relationship_status = payload.show_relationship_status
    prof.show_contact_email = payload.show_contact_email
    prof.show_contact_phone = payload.show_contact_phone
    prof.show_workplace = payload.show_workplace

    db.query(UserPosition).filter(UserPosition.user_id == current.id).delete()
    db.query(UserEducation).filter(UserEducation.user_id == current.id).delete()

    for p in (payload.positions or []):
        db.add(UserPosition(user_id=current.id, company=p.company, title=p.title, start=p.start, end=p.end))
    for e in (payload.education or []):
        db.add(UserEducation(user_id=current.id, institution=e.institution, degree=e.degree, start=e.start, end=e.end))

    db.commit()
    db.refresh(prof)

    positions = db.query(UserPosition).filter(UserPosition.user_id == current.id).all()
    education = db.query(UserEducation).filter(UserEducation.user_id == current.id).all()

    return ProfileOut(
        id=prof.id,
        user_id=current.id,
        bio=prof.bio,
        hometown=prof.hometown,
        current_city=prof.current_city,
        relationship_status=prof.relationship_status,
        contact_email=prof.contact_email,
        contact_phone=prof.contact_phone,
        workplace_company=prof.workplace_company,
        workplace_title=prof.workplace_title,
        connections_count=prof.connections_count or 0,
        show_hometown=prof.show_hometown,
        show_current_city=prof.show_current_city,
        show_relationship_status=prof.show_relationship_status,
        show_contact_email=prof.show_contact_email,
        show_contact_phone=prof.show_contact_phone,
        show_workplace=prof.show_workplace,
        positions=[
            {"company": p.company, "title": p.title, "start": p.start, "end": p.end}
            for p in positions
        ],
        education=[
            {"institution": e.institution, "degree": e.degree, "start": e.start, "end": e.end}
            for e in education
        ],
        created_at=prof.created_at,
        updated_at=prof.updated_at,
    )

@router.get("/{user_id}/profile", response_model=ProfileOut)
async def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    user = None
    if user_id.isdigit():
        user = db.query(User).filter(User.id == int(user_id)).first()
    else:
        user = db.query(User).filter(User.username == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    prof = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    positions = db.query(UserPosition).filter(UserPosition.user_id == user.id).all()
    education = db.query(UserEducation).filter(UserEducation.user_id == user.id).all()

    if not prof:
        return ProfileOut(
            id=None,
            user_id=user.id,
            bio=None,
            hometown=None,
            current_city=None,
            relationship_status=None,
            contact_email=user.email,
            contact_phone=None,
            workplace_company=None,
            workplace_title=None,
            connections_count=0,
            show_hometown=True,
            show_current_city=True,
            show_relationship_status=True,
            show_contact_email=False,
            show_contact_phone=False,
            show_workplace=True,
            positions=[],
            education=[],
            created_at=None,
            updated_at=None,
        )

    return ProfileOut(
        id=prof.id,
        user_id=user.id,
        bio=prof.bio,
        hometown=prof.hometown if prof.show_hometown else None,
        current_city=prof.current_city if prof.show_current_city else None,
        relationship_status=prof.relationship_status if prof.show_relationship_status else None,
        contact_email=prof.contact_email if prof.show_contact_email else None,
        contact_phone=prof.contact_phone if prof.show_contact_phone else None,
        workplace_company=prof.workplace_company if prof.show_workplace else None,
        workplace_title=prof.workplace_title if prof.show_workplace else None,
        connections_count=prof.connections_count or 0,
        show_hometown=prof.show_hometown,
        show_current_city=prof.show_current_city,
        show_relationship_status=prof.show_relationship_status,
        show_contact_email=prof.show_contact_email,
        show_contact_phone=prof.show_contact_phone,
        show_workplace=prof.show_workplace,
        positions=[
            {"company": p.company, "title": p.title, "start": p.start, "end": p.end}
            for p in positions
        ] if prof.show_workplace else [],
        education=[
            {"institution": e.institution, "degree": e.degree, "start": e.start, "end": e.end}
            for e in education
        ],
        created_at=prof.created_at,
        updated_at=prof.updated_at,
    )

@router.get("/{user_id}/friends")
async def get_user_friends(user_id: str, db: Session = Depends(get_db)):
    user = None
    if user_id.isdigit():
        user = db.query(User).filter(User.id == int(user_id)).first()
    else:
        user = db.query(User).filter(User.username == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    from database.models import Friendship

    links = db.query(Friendship).filter(Friendship.user_id == user.id).all()
    friend_ids = [l.friend_id for l in links]
    if not friend_ids:
        return []
    friends = db.query(User).filter(User.id.in_(friend_ids)).all()
    return [
        {
            "id": f.id,
            "name": f"{f.first_name} {f.last_name}",
            "avatar": f.profile_photo,
        }
        for f in friends
    ]
