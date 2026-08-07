from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, schemas
from app.db import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("/users", response_model=List[schemas.LeaderboardUser])
def leaderboard_users(
    department_id: int = None,
    limit: int = 20,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    q = db.query(models.User)
    if department_id:
        q = q.filter(models.User.department_id == department_id)
    users = q.order_by(models.User.total_points.desc()).limit(limit).all()
    return [
        schemas.LeaderboardUser(
            rank=i + 1,
            user_id=u.id,
            name=u.name,
            department=u.department.name if u.department else None,
            total_points=u.total_points,
            sustainability_score=u.sustainability_score,
        )
        for i, u in enumerate(users)
    ]


@router.get("/departments", response_model=List[schemas.LeaderboardDepartment])
def leaderboard_departments(
    limit: int = 20,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    rows = (
        db.query(
            models.Department,
            func.sum(models.User.total_points).label("total_points"),
            func.count(models.User.id).label("member_count"),
        )
        .join(models.User, models.User.department_id == models.Department.id, isouter=True)
        .group_by(models.Department.id)
        .order_by(func.sum(models.User.total_points).desc())
        .limit(limit)
        .all()
    )
    return [
        schemas.LeaderboardDepartment(
            rank=i + 1,
            department_id=row.Department.id,
            name=row.Department.name,
            type=row.Department.type,
            total_points=row.total_points or 0,
            member_count=row.member_count or 0,
        )
        for i, row in enumerate(rows)
    ]
