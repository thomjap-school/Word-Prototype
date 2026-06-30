""" app/routers/auth.py """

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, security

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Vérifier que l'email n'existe pas déjà
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    # Créer le nouvel utilisateur
    new_user = models.User(
        email=user.email,
        hashed_password=security.hash_password(user.password),
        full_name=user.full_name,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()

    if not user or not security.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    access_token = security.create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token}