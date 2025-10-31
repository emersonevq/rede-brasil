import os
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database.session import get_db
from database.models import Post
from schemas.post import PostCreate, PostOut
from dependencies import get_current_user

router = APIRouter()

MEDIA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "media")
MEDIA_DIR = os.path.abspath(MEDIA_DIR)
os.makedirs(MEDIA_DIR, exist_ok=True)

@router.get("/", response_model=List[PostOut])
def list_posts(db: Session = Depends(get_db)):
    posts = db.query(Post).order_by(Post.created_at.desc()).all()
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

@router.get("/{post_id}", response_model=PostOut)
def get_post(post_id: int, db: Session = Depends(get_db)):
    p = db.query(Post).filter(Post.id == post_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Post não encontrado")
    return PostOut(
        id=p.id,
        content=p.content,
        media_url=p.media_url,
        created_at=p.created_at,
        user_id=p.user_id,
        user_name=f"{p.author.first_name} {p.author.last_name}" if p.author else "Anônimo",
        user_profile_photo=p.author.profile_photo if p.author else None,
        user_cover_photo=p.author.cover_photo if p.author else None,
    )

@router.post("/", response_model=PostOut)
def create_post(payload: PostCreate, db: Session = Depends(get_db), current=Depends(get_current_user)):
    post = Post(user_id=current.id, content=payload.content, media_url=payload.media_url)
    db.add(post)
    db.commit()
    db.refresh(post)
    return PostOut(
        id=post.id,
        content=post.content,
        media_url=post.media_url,
        created_at=post.created_at,
        user_id=current.id,
        user_name=f"{current.first_name} {current.last_name}",
        user_profile_photo=current.profile_photo,
        user_cover_photo=current.cover_photo,
    )

@router.post("/upload", response_model=PostOut)
def create_post_with_upload(
    content: str = Form(""),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    media_url = None
    if file is not None:
        name = file.filename or "upload.bin"
        base, ext = os.path.splitext(name)
        safe_name = base.replace(" ", "_")
        final_name = f"{safe_name}_{current.id}_{os.getpid()}{ext or ''}"
        file_path = os.path.join(MEDIA_DIR, final_name)
        with open(file_path, "wb") as out:
            out.write(file.file.read())
        media_url = f"/media/{final_name}"

    post = Post(user_id=current.id, content=content, media_url=media_url)
    db.add(post)
    db.commit()
    db.refresh(post)

    return PostOut(
        id=post.id,
        content=post.content,
        media_url=post.media_url,
        created_at=post.created_at,
        user_id=current.id,
        user_name=f"{current.first_name} {current.last_name}",
        user_profile_photo=current.profile_photo,
        user_cover_photo=current.cover_photo,
    )

@router.delete("/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db), current=Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post não encontrado")
    if post.user_id != current.id:
        raise HTTPException(status_code=403, detail="Você não tem permissão para deletar este post")
    db.delete(post)
    db.commit()
    return {"message": "Post deletado com sucesso"}

@router.put("/{post_id}", response_model=PostOut)
def update_post(
    post_id: int,
    payload: PostCreate,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post não encontrado")
    if post.user_id != current.id:
        raise HTTPException(status_code=403, detail="Você não tem permissão para editar este post")
    post.content = payload.content
    if payload.media_url:
        post.media_url = payload.media_url
    db.commit()
    db.refresh(post)
    return PostOut(
        id=post.id,
        content=post.content,
        media_url=post.media_url,
        created_at=post.created_at,
        user_id=post.user_id,
        user_name=f"{post.author.first_name} {post.author.last_name}" if post.author else "Anônimo",
        user_profile_photo=post.author.profile_photo if post.author else None,
        user_cover_photo=post.author.cover_photo if post.author else None,
    )
