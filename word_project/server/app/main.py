""" app/main.py """

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, documents
import os

from app.database import engine, Base

# Créer les tables en DB si elles n'existent pas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="WordV2 API")


@app.post("/visitor")
async def visitor(request: Request):
    ip = request.client.host
    print("Nouveau visiteur :", ip)
    return {"ok": True}


app.include_router(auth.router)
app.include_router(documents.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "WordV2 API is running"}
