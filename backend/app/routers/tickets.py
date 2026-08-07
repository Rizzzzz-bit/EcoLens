import os
import uuid
import datetime
import math
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app import models, schemas
from app.db import get_db
from app.dependencies import get_current_user, require_role
from app.ai.classifier import classify_image
from app.services.gamification import award_points

router = APIRouter(prefix="/tickets", tags=["tickets"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")


def _nearest_department(lat: float, lng: float, db: Session) -> models.Department:
    depts = db.query(models.Department).all()
    if not depts:
        raise HTTPException(status_code=500, detail="No departments configured")
    return min(depts, key=lambda d: math.sqrt((d.lat - lat) ** 2 + (d.lng - lng) ** 2))


@router.post("", response_model=schemas.TicketOut)
async def create_ticket(
    lat: float = Form(...),
    lng: float = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    image_bytes = await image.read()
    ai_result = classify_image(image_bytes)

    # Save image
    ext = os.path.splitext(image.filename or "upload.jpg")[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
        f.write(image_bytes)
    image_url = f"/uploads/{filename}"

    # Routing: hazardous → first dept named Safety (fallback: nearest)
    if ai_result["category"] == models.TicketCategory.hazardous:
        safety = db.query(models.Department).filter(
            models.Department.name.ilike("%safety%")
        ).first()
        dept = safety or _nearest_department(lat, lng, db)
    else:
        dept = _nearest_department(lat, lng, db)

    ticket = models.Ticket(
        reporter_id=current_user.id,
        department_id=dept.id,
        category=ai_result["category"],
        action_recommendation=ai_result["action_recommendation"],
        eco_tip=ai_result["eco_tip"],
        image_url=image_url,
        lat=lat,
        lng=lng,
        ai_confidence=ai_result["confidence"],
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    award_points(current_user.id, "report_submitted", db, ticket_id=ticket.id)
    db.refresh(ticket)
    return ticket


@router.get("", response_model=List[schemas.TicketOut])
def list_tickets(
    status: Optional[models.TicketStatus] = None,
    category: Optional[models.TicketCategory] = None,
    department_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Ticket)

    # Role scoping
    if current_user.role in (models.UserRole.student, models.UserRole.staff):
        q = q.filter(models.Ticket.reporter_id == current_user.id)
    elif current_user.role in (models.UserRole.dept_staff, models.UserRole.warden):
        q = q.filter(models.Ticket.department_id == current_user.department_id)

    if status:
        q = q.filter(models.Ticket.status == status)
    if category:
        q = q.filter(models.Ticket.category == category)
    if department_id and current_user.role == models.UserRole.admin:
        q = q.filter(models.Ticket.department_id == department_id)

    return q.order_by(models.Ticket.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/heatmap", response_model=List[schemas.HeatmapPoint])
def heatmap(db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    tickets = db.query(models.Ticket).filter(
        models.Ticket.status != models.TicketStatus.resolved
    ).all()
    return [
        schemas.HeatmapPoint(
            lat=t.lat,
            lng=t.lng,
            weight=1.0 if t.status == models.TicketStatus.raised else 0.5,
        )
        for t in tickets
    ]


@router.get("/{ticket_id}", response_model=schemas.TicketOut)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    # Access control
    if current_user.role in (models.UserRole.student, models.UserRole.staff):
        if ticket.reporter_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your ticket")
    elif current_user.role in (models.UserRole.dept_staff, models.UserRole.warden):
        if ticket.department_id != current_user.department_id:
            raise HTTPException(status_code=403, detail="Not your department")
    return ticket


@router.patch("/{ticket_id}/status", response_model=schemas.TicketOut)
def update_status(
    ticket_id: int,
    body: schemas.TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        require_role(models.UserRole.dept_staff, models.UserRole.warden, models.UserRole.admin)
    ),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Scope check for dept_staff / warden
    if current_user.role in (models.UserRole.dept_staff, models.UserRole.warden):
        if ticket.department_id != current_user.department_id:
            raise HTTPException(status_code=403, detail="Not your department")

    ticket.status = body.status
    ticket.updated_at = datetime.datetime.utcnow()
    if body.status == models.TicketStatus.resolved:
        ticket.resolved_at = datetime.datetime.utcnow()
        award_points(ticket.reporter_id, "ticket_resolved", db, ticket_id=ticket.id)

    db.commit()
    db.refresh(ticket)
    return ticket
