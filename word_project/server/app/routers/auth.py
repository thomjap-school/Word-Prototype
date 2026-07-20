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


def _issue_verification_token(user: models.User) -> str:
    token = secrets.token_urlsafe(32)
    user.verification_token = token
    user.verification_token_expires_at = datetime.now(timezone.utc) + VERIFICATION_TOKEN_TTL
    return token


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
    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Confirme ton email avant de te connecter",
        )
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


@router.put("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    if not security.verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Mot de passe actuel incorrect")
    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Le nouveau mot de passe doit contenir au moins 8 caractères",
        )
    current_user.hashed_password = security.hash_password(payload.new_password)
    db.commit()