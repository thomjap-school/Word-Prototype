""" app/main.py """

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, documents
import os

from app.database import engine, Base
from app.routers import auth

# Créer les tables en DB si elles n'existent pas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="WordV2 API")

app.include_router(auth.router)
app.include_router(documents.router)

allowed_origins = os.getenv(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173"
    ).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)


@app.get("/")
def read_root():
    return {"message": "WordV2 API is running"}
