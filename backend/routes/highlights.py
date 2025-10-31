from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.session import get_db
from schemas.highlight import HighlightCreate, HighlightUpdate, HighlightOut
from dependencies import get_current_user
from database.models import User, Highlight
from typing import List

router = APIRouter()

@router.post("", response_model=HighlightOut)
async def create_highlight(
    highlight: HighlightCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        new_highlight = Highlight(
            user_id=current.id,
            name=highlight.name,
            cover=highlight.cover,
            photos=highlight.photos
        )
        db.add(new_highlight)
        db.commit()
        db.refresh(new_highlight)
        return new_highlight
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error creating highlight: {str(e)}")

@router.get("", response_model=List[HighlightOut])
async def get_highlights(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    highlights = db.query(Highlight).filter(Highlight.user_id == current.id).order_by(Highlight.created_at.desc()).all()
    return highlights

@router.get("/{highlight_id}", response_model=HighlightOut)
async def get_highlight(
    highlight_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    highlight = db.query(Highlight).filter(
        Highlight.id == highlight_id,
        Highlight.user_id == current.id
    ).first()
    
    if not highlight:
        raise HTTPException(status_code=404, detail="Destaque não encontrado")
    
    return highlight

@router.put("/{highlight_id}", response_model=HighlightOut)
async def update_highlight(
    highlight_id: int,
    highlight_update: HighlightUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    highlight = db.query(Highlight).filter(
        Highlight.id == highlight_id,
        Highlight.user_id == current.id
    ).first()
    
    if not highlight:
        raise HTTPException(status_code=404, detail="Destaque não encontrado")
    
    try:
        if highlight_update.name is not None:
            highlight.name = highlight_update.name
        if highlight_update.cover is not None:
            highlight.cover = highlight_update.cover
        if highlight_update.photos is not None:
            highlight.photos = highlight_update.photos
        
        db.add(highlight)
        db.commit()
        db.refresh(highlight)
        return highlight
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error updating highlight: {str(e)}")

@router.delete("/{highlight_id}")
async def delete_highlight(
    highlight_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    highlight = db.query(Highlight).filter(
        Highlight.id == highlight_id,
        Highlight.user_id == current.id
    ).first()
    
    if not highlight:
        raise HTTPException(status_code=404, detail="Destaque não encontrado")
    
    try:
        db.delete(highlight)
        db.commit()
        return {"success": True, "message": "Destaque deletado com sucesso"}
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error deleting highlight: {str(e)}")
