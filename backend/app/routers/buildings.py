import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, schemas
from app.db import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/buildings", tags=["buildings"])


@router.get("", response_model=List[schemas.DepartmentOut])
def list_buildings(
    type: Optional[models.DepartmentType] = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    q = db.query(models.Department)
    if type:
        q = q.filter(models.Department.type == type)
    return q.all()


@router.get("/{dept_id}/readings", response_model=List[schemas.SensorReadingOut])
def get_readings(
    dept_id: int,
    metric: models.MetricType = Query(...),
    from_dt: Optional[datetime.datetime] = Query(None),
    to_dt: Optional[datetime.datetime] = Query(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    q = db.query(models.SensorReading).filter(
        models.SensorReading.department_id == dept_id,
        models.SensorReading.metric == metric,
    )
    if from_dt:
        q = q.filter(models.SensorReading.recorded_at >= from_dt)
    if to_dt:
        q = q.filter(models.SensorReading.recorded_at <= to_dt)
    return q.order_by(models.SensorReading.recorded_at.asc()).limit(500).all()


@router.get("/{dept_id}/router", response_model=schemas.RouterSnapshotOut)
def router_snapshot(
    dept_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    def latest(metric):
        row = (
            db.query(models.SensorReading)
            .filter(
                models.SensorReading.department_id == dept_id,
                models.SensorReading.metric == metric,
            )
            .order_by(models.SensorReading.recorded_at.desc())
            .first()
        )
        return row.value if row else None

    return schemas.RouterSnapshotOut(
        department_id=dept_id,
        devices=latest(models.MetricType.devices),
        bandwidth=latest(models.MetricType.bandwidth),
    )
