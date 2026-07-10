""" app/routers/documents.py """

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app import models, schemas, security

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=list[schemas.DocumentSummary])
def list_documents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    return (
        db.query(models.Document)
        .filter(models.Document.owner_id == current_user.id)
        .order_by(desc(models.Document.updated_at), desc(
            models.Document.created_at
            ))
        .all()
    )


@router.get("/{document_id}", response_model=schemas.DocumentOut)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.owner_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")
    return doc


@router.post("", response_model=schemas.DocumentOut)
def create_document(
    payload: schemas.DocumentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    doc = models.Document(
        title=payload.title,
        content=payload.content,  # sera None dans le nouveau flux
        owner_id=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.put("/{document_id}", response_model=schemas.DocumentOut)
def update_document(
    document_id: int,
    payload: schemas.DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.owner_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")

    if payload.title is not None:
        doc.title = payload.title
    if payload.content is not None:
        doc.content = payload.content

    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{document_id}", status_code=204)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.owner_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")
    db.delete(doc)
    db.commit()


# Routes internes utilisées par le serveur de collaboration (Hocuspocus),
# authentifiées par secret partagé plutôt que par JWT utilisateur.
@router.get("/internal/{document_id}", response_model=schemas.DocumentOut)
def get_document_internal(
    document_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(security.verify_internal_secret),
):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")
    return doc


@router.put("/internal/{document_id}", response_model=schemas.DocumentOut)
def update_document_internal(
    document_id: int,
    payload: schemas.DocumentUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(security.verify_internal_secret),
):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")

    if payload.title is not None:
        doc.title = payload.title
    if payload.content is not None:
        doc.content = payload.content

    db.commit()
    db.refresh(doc)
    return doc
