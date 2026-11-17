import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.db import engine, Base
from app.routers import auth, tickets, ai, buildings, analytics, leaderboard, users

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

# Comma-separated allowed origins, e.g. "https://ecolens.vercel.app"
# Defaults to localhost for local dev; override in .env for production.
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost,http://localhost:80")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    yield


app = FastAPI(title="EcoLens API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(ai.router)
app.include_router(buildings.router)
app.include_router(analytics.router)
app.include_router(leaderboard.router)
app.include_router(users.router)


@app.get("/health")
def health():
    return {"status": "ok"}
