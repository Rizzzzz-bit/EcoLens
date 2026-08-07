from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app import models, schemas
from app.db import get_db
from app.dependencies import get_current_user
from app.services.gamification import get_recommendations

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me/stats", response_model=schemas.UserOut)
def my_stats(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.get("/me/badges", response_model=List[schemas.UserBadgeOut])
def my_badges(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(models.UserBadge).filter(
        models.UserBadge.user_id == current_user.id
    ).all()


@router.get("/me/recommendations", response_model=schemas.RecommendationOut)
def my_recommendations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tips = get_recommendations(current_user.id, db)
    return {"tips": tips}


@router.get("/{user_id}/badges", response_model=List[schemas.UserBadgeOut])
def user_badges(
    user_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    return db.query(models.UserBadge).filter(
        models.UserBadge.user_id == user_id
    ).all()
