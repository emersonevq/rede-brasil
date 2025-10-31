import os
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database.session import get_db
from database.models import Story
from schemas.story import StoryCreate, StoryOut
from dependencies import get_current_user

router = APIRouter()

MEDIA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "media")
MEDIA_DIR = os.path.abspath(MEDIA_DIR)
os.makedirs(MEDIA_DIR, exist_ok=True)

@router.get("/", response_model=List[StoryOut])
def list_stories(db: Session = Depends(get_db)):
    stories = db.query(Story).order_by(Story.created_at.desc()).all()
    return [
        StoryOut(
            id=s.id,
            content=s.content,
            media_url=s.media_url,
            created_at=s.created_at,
            user_id=s.user_id,
            user_name=f"{s.author.first_name} {s.author.last_name}" if s.author else "Anônimo",
            user_profile_photo=s.author.profile_photo if s.author else None,
        ) for s in stories
    ]

@router.get("/{story_id}", response_model=StoryOut)
def get_story(story_id: int, db: Session = Depends(get_db)):
    s = db.query(Story).filter(Story.id == story_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Story não encontrado")
    return StoryOut(
        id=s.id,
        content=s.content,
        media_url=s.media_url,
        created_at=s.created_at,
        user_id=s.user_id,
        user_name=f"{s.author.first_name} {s.author.last_name}" if s.author else "Anônimo",
        user_profile_photo=s.author.profile_photo if s.author else None,
    )

@router.post("/", response_model=StoryOut)
def create_story(payload: StoryCreate, db: Session = Depends(get_db), current=Depends(get_current_user)):
    story = Story(user_id=current.id, content=payload.content or "", media_url=payload.media_url)
    db.add(story)
    db.commit()
    db.refresh(story)
    return StoryOut(
        id=story.id,
        content=story.content,
        media_url=story.media_url,
        created_at=story.created_at,
        user_id=current.id,
        user_name=f"{current.first_name} {current.last_name}",
        user_profile_photo=current.profile_photo,
    )

@router.post("/upload", response_model=StoryOut)
def create_story_with_upload(
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
        contents = file.file.read()
        with open(file_path, "wb") as out:
            out.write(contents)
        media_url = f"/media/{final_name}"

    story = Story(user_id=current.id, content=content or "", media_url=media_url)
    db.add(story)
    db.commit()
    db.refresh(story)
    return StoryOut(
        id=story.id,
        content=story.content,
        media_url=story.media_url,
        created_at=story.created_at,
        user_id=current.id,
        user_name=f"{current.first_name} {current.last_name}",
        user_profile_photo=current.profile_photo,
    )

@router.delete("/{story_id}")
def delete_story(story_id: int, db: Session = Depends(get_db), current=Depends(get_current_user)):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story não encontrado")
    if story.user_id != current.id:
        raise HTTPException(status_code=403, detail="Você não tem permissão para deletar este story")
    db.delete(story)
    db.commit()
    return {"message": "Story deletado com sucesso"}
