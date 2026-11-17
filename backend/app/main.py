import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.db import engine, Base
from app.routers import auth, tickets, ai, buildings, analytics, leaderboard, users

logger = logging.getLogger(__name__)

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

# Comma-separated allowed origins, e.g. "https://ecolens.vercel.app"
# Defaults to localhost for local dev; override in .env for production.
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost,http://localhost:80")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]


def _auto_seed():
    """Seed demo data and always sync users to the 2 defined credentials."""
    try:
        from app.db import SessionLocal
        from app import models
        from app.dependencies import hash_password
        db = SessionLocal()

        # Always enforce exactly these 2 users — delete any others
        USERS = [
            {"name": "Admin",  "email": "admin@ecolens.in", "role": models.UserRole.admin,   "dept_name": None},
            {"name": "User",   "email": "user@ecolens.in",  "role": models.UserRole.student, "dept_name": "Computer Science Block"},
        ]
        target_emails = {u["email"] for u in USERS}
        deleted = db.query(models.User).filter(models.User.email.notin_(target_emails)).delete(synchronize_session=False)
        db.commit()
        if deleted:
            logger.info(f"Removed {deleted} stale user(s) from DB.")

        for u in USERS:
            dept = db.query(models.Department).filter(models.Department.name == u["dept_name"]).first() if u["dept_name"] else None
            existing = db.query(models.User).filter(models.User.email == u["email"]).first()
            if existing:
                existing.name = u["name"]
                existing.role = u["role"]
                existing.hashed_password = hash_password("password123")
                existing.department_id = dept.id if dept else None
            else:
                db.add(models.User(
                    name=u["name"],
                    email=u["email"],
                    hashed_password=hash_password("password123"),
                    role=u["role"],
                    department_id=dept.id if dept else None,
                ))
        db.commit()
        logger.info("Users synced: admin@ecolens.in + user@ecolens.in (password: password123)")

        # Seed rest of the data only if DB is otherwise empty
        if db.query(models.Department).count() == 0:
            logger.info("Empty database detected — running full seed...")
            import scripts.seed  # noqa: F401
            logger.info("Full seed complete.")

        db.close()
    except Exception as e:
        logger.warning(f"Auto-seed failed (non-fatal): {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    _auto_seed()
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


@app.get("/debug-users")
def debug_users():
    from app.db import SessionLocal
    from app import models
    db = SessionLocal()
    users = db.query(models.User).all()
    result = [{"id": u.id, "email": u.email, "role": u.role, "name": u.name} for u in users]
    db.close()
    return {"count": len(result), "users": result}


@app.post("/admin/force-sync-users")
def force_sync_users():
    """Force delete all users except admin+user and upsert them with password123."""
    from app.db import SessionLocal
    from app import models
    from app.dependencies import hash_password

    USERS = [
        {"name": "Admin", "email": "admin@ecolens.in", "role": models.UserRole.admin,   "dept_name": None},
        {"name": "User",  "email": "user@ecolens.in",  "role": models.UserRole.student, "dept_name": "Computer Science Block"},
    ]

    db = SessionLocal()
    try:
        target_emails = {u["email"] for u in USERS}

        # Find user IDs to delete first
        users_to_delete = db.query(models.User).filter(models.User.email.notin_(target_emails)).all()
        ids_to_delete = [u.id for u in users_to_delete]

        if ids_to_delete:
            # Delete dependent rows first to avoid FK violations
            db.query(models.UserBadge).filter(models.UserBadge.user_id.in_(ids_to_delete)).delete(synchronize_session=False)
            db.query(models.RewardPoint).filter(models.RewardPoint.user_id.in_(ids_to_delete)).delete(synchronize_session=False)
            db.query(models.Ticket).filter(models.Ticket.reporter_id.in_(ids_to_delete)).delete(synchronize_session=False)
            db.query(models.User).filter(models.User.id.in_(ids_to_delete)).delete(synchronize_session=False)
            db.commit()

        deleted = len(ids_to_delete)

        for u in USERS:
            dept = db.query(models.Department).filter(models.Department.name == u["dept_name"]).first() if u["dept_name"] else None
            existing = db.query(models.User).filter(models.User.email == u["email"]).first()
            if existing:
                existing.name = u["name"]
                existing.role = u["role"]
                existing.hashed_password = hash_password("password123")
                existing.department_id = dept.id if dept else None
            else:
                db.add(models.User(
                    name=u["name"],
                    email=u["email"],
                    hashed_password=hash_password("password123"),
                    role=u["role"],
                    department_id=dept.id if dept else None,
                ))
        db.commit()

        users = db.query(models.User).all()
        result = [{"id": u.id, "email": u.email, "role": u.role} for u in users]
        return {"deleted_old": deleted, "users": result}
    finally:
        db.close()
