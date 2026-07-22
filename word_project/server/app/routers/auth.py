""" app/routers/auth.py """
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, security
from app.email import send_verification_email

router = APIRouter(prefix="/auth", tags=["auth"])

VERIFICATION_TOKEN_TTL = timedelta(hours=24)
ACCOUNT_DELETION_GRACE_PERIOD = timedelta(days=3)


def _issue_verification_token(user: models.User) -> str:
    token = secrets.token_urlsafe(32)
    user.verification_token = token
    user.verification_token_expires_at = datetime.now(timezone.utc) + VERIFICATION_TOKEN_TTL
    return token


def _purge_account_if_expired(db: Session, user: models.User) -> bool:
    """
    Si le compte est marqué supprimé depuis plus de 3 jours, le purge
    définitivement de la base (vérification paresseuse : on ne fait ça
    qu'au moment où quelqu'un tente de s'en servir, pas de tâche planifiée).
    Retourne True si le compte vient d'être purgé.
    """
    if user.deleted_at is None:
        return False

    deleted_at = user.deleted_at
    if deleted_at.tzinfo is None:
        deleted_at = deleted_at.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) < deleted_at + ACCOUNT_DELETION_GRACE_PERIOD:
        return False

    # Nettoyage des liens de collaboration avant de supprimer le compte,
    # sinon on laisse des lignes qui pointent vers un user_id inexistant
    # (ce qui plante la propriété Document.collaborators).
    db.query(models.DocumentCollaborator).filter(
        models.DocumentCollaborator.user_id == user.id
    ).delete()
    db.query(models.DocumentCollaborator).filter(
        models.DocumentCollaborator.invited_by_id == user.id
    ).update({"invited_by_id": None})

    db.delete(user)
    db.commit()
    return True


@router.post(
    "/register",
    response_model=schemas.UserOut
)
def register(
    user: schemas.UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    # Vérifier que l'email n'existe pas déjà
    existing_user = db.query(models.User).filter(
        models.User.email == user.email
        ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    # Créer le nouvel utilisateur
    new_user = models.User(
        email=user.email,
        hashed_password=security.hash_password(user.password),
        full_name=user.full_name,
        is_verified=False,
    )
    token = _issue_verification_token(new_user)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    background_tasks.add_task(send_verification_email, new_user, token)
    return new_user


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.email == credentials.email
        ).first()
    if not user or not user.hashed_password or not security.verify_password(
        credentials.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Email ou mot de passe incorrect"
        )

    # Compte marqué comme supprimé : soit on le purge (délai dépassé),
    # soit on refuse la connexion classique et on renvoie un statut dédié
    # (410 Gone) pour que le frontend affiche le bouton "réactiver" au lieu
    # du login normal.
    if user.deleted_at is not None:
        purged = _purge_account_if_expired(db, user)
        if purged:
            raise HTTPException(
                status_code=401,
                detail="Email ou mot de passe incorrect"
            )
        raise HTTPException(
            status_code=410,
            detail="Ce compte est en attente de suppression. Réactive-le pour te reconnecter.",
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Confirme ton email avant de te connecter",
        )
    access_token = security.create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token}


@router.post("/reactivate", response_model=schemas.Token)
def reactivate_account(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.email == credentials.email
    ).first()
    if not user or not user.hashed_password or not security.verify_password(
        credentials.password,
        user.hashed_password
    ):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    if user.deleted_at is None:
        raise HTTPException(status_code=400, detail="Ce compte n'est pas en attente de suppression")

    purged = _purge_account_if_expired(db, user)
    if purged:
        raise HTTPException(
            status_code=404,
            detail="Ce compte a été définitivement supprimé, il n'est plus récupérable",
        )

    user.deleted_at = None
    db.commit()
    db.refresh(user)

    access_token = security.create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token}


@router.get("/verify-email", response_model=schemas.VerifyEmailResponse)
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.verification_token == token
    ).first()
    if not user or not user.verification_token_expires_at:
        raise HTTPException(status_code=400, detail="Lien de confirmation invalide")
    expires_at = user.verification_token_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Lien de confirmation expiré")

    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires_at = None
    db.commit()
    return {"message": "Compte confirmé, tu peux te connecter."}


@router.post("/resend-verification", response_model=schemas.VerifyEmailResponse)
def resend_verification(
    payload: schemas.ResendVerificationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(
        models.User.email == payload.email
    ).first()
    if user and not user.is_verified:
        token = _issue_verification_token(user)
        db.commit()
        background_tasks.add_task(send_verification_email, user, token)
    # Message générique : on ne révèle jamais si l'email existe ou est déjà vérifié.
    return {"message": "Si ce compte existe et n'est pas encore confirmé, un email vient d'être envoyé."}


@router.post("/google", response_model=schemas.Token)
def login_with_google(payload: schemas.GoogleAuthRequest, db: Session = Depends(get_db)):
    google_user = security.verify_google_id_token(payload.credential)

    user = db.query(models.User).filter(
        models.User.google_id == google_user["google_id"]
    ).first()
    if not user:
        user = db.query(models.User).filter(
            models.User.email == google_user["email"]
        ).first()

    if user:
        user.google_id = google_user["google_id"]
        user.is_verified = True
    else:
        user = models.User(
            email=google_user["email"],
            full_name=google_user["full_name"],
            google_id=google_user["google_id"],
            is_verified=True,
        )
        db.add(user)
    db.commit()
    db.refresh(user)

    access_token = security.create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token}


@router.get("/me", response_model=schemas.UserOut)
def read_current_user(
    current_user: models.User = Depends(security.get_current_user)
):
    return current_user


@router.put("/me", response_model=schemas.UserOut)
def update_current_user(
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    if payload.email is not None and payload.email != current_user.email:
        existing = db.query(models.User).filter(
            models.User.email == payload.email
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email déjà utilisé")
        current_user.email = payload.email

    if payload.full_name is not None:
        current_user.full_name = payload.full_name

    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_current_user(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    # On bloque la suppression si l'utilisateur est propriétaire de documents,
    # pour éviter des documents orphelins (pas de mécanisme de transfert de
    # propriété pour l'instant).
    owns_documents = db.query(models.Document).filter(
        models.Document.owner_id == current_user.id
    ).count() > 0
    if owns_documents:
        raise HTTPException(
            status_code=400,
            detail="Supprime ou transfère d'abord tes documents avant de supprimer ton compte",
        )

    current_user.deleted_at = datetime.now(timezone.utc)
    db.commit()


@router.put("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    if not current_user.hashed_password or not security.verify_password(
        payload.current_password, current_user.hashed_password
    ):
        raise HTTPException(status_code=401, detail="Mot de passe actuel incorrect")
    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Le nouveau mot de passe doit contenir au moins 8 caractères",
        )
    current_user.hashed_password = security.hash_password(payload.new_password)
    db.commit()
