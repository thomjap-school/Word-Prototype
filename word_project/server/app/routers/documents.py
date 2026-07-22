""" app/routers/documents.py """

import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from app.database import get_db
from app import models, schemas, security

router = APIRouter(prefix="/documents", tags=["documents"])


def _has_access(doc: models.Document, user: models.User) -> bool:
    if doc.owner_id == user.id:
        return True
    return any(u.id == user.id for u in doc.collaborators)


@router.get("", response_model=list[schemas.DocumentSummary])
def list_documents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    return (
        db.query(models.Document)
        .outerjoin(models.DocumentCollaborator)
        .filter(
            or_(
                models.Document.owner_id == current_user.id,
                models.DocumentCollaborator.user_id == current_user.id,
            )
        )
        .distinct()
        .order_by(desc(models.Document.updated_at), desc(models.Document.created_at))
        .all()
    )


@router.get("/{document_id}", response_model=schemas.DocumentOut)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc or not _has_access(doc, current_user):
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
        content=payload.content,
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
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc or not _has_access(doc, current_user):
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


@router.post("/{document_id}/invite", response_model=schemas.DocumentOut)
def invite_collaborator(
    document_id: int,
    payload: schemas.InviteRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    # N'importe quel collaborateur (pas seulement le propriétaire) peut inviter
    if not doc or not _has_access(doc, current_user):
        raise HTTPException(status_code=404, detail="Document introuvable")

    invited_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not invited_user:
        raise HTTPException(status_code=404, detail="Aucun compte trouvé avec cet email")
    if invited_user.id == doc.owner_id:
        raise HTTPException(status_code=400, detail="Cette personne est déjà propriétaire de ce document")
    already = db.query(models.DocumentCollaborator).filter(
        models.DocumentCollaborator.document_id == document_id,
        models.DocumentCollaborator.user_id == invited_user.id,
    ).first()
    if already:
        raise HTTPException(status_code=400, detail="Cette personne est déjà collaboratrice")

    db.add(models.DocumentCollaborator(document_id=document_id, user_id=invited_user.id))
    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{document_id}/collaborators/{user_id}", response_model=schemas.DocumentOut)
def remove_collaborator(
    document_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.owner_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")

    collab = db.query(models.DocumentCollaborator).filter(
        models.DocumentCollaborator.document_id == document_id,
        models.DocumentCollaborator.user_id == user_id,
    ).first()
    if not collab:
        raise HTTPException(status_code=404, detail="Collaborateur introuvable")

    db.delete(collab)
    db.commit()
    db.refresh(doc)
    return doc


@router.post("/{document_id}/share-link", response_model=schemas.ShareLinkOut)
def generate_share_link(
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

    if not doc.share_token:
        doc.share_token = secrets.token_urlsafe(16)
        db.commit()
        db.refresh(doc)

    return {"share_token": doc.share_token}


@router.post("/join/{token}", response_model=schemas.DocumentOut)
def join_via_share_link(
    token: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    doc = db.query(models.Document).filter(models.Document.share_token == token).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Lien de partage invalide")

    if doc.owner_id != current_user.id:
        already = db.query(models.DocumentCollaborator).filter(
            models.DocumentCollaborator.document_id == doc.id,
            models.DocumentCollaborator.user_id == current_user.id,
        ).first()
        if not already:
            db.add(models.DocumentCollaborator(document_id=doc.id, user_id=current_user.id))
            db.commit()
            db.refresh(doc)

    return doc
