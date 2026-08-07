import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, schemas
from app.db import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=schemas.AnalyticsSummary)
def summary(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    thirty_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=30)

    # Tickets by category (last 30 days)
    cat_rows = (
        db.query(models.Ticket.category, func.count(models.Ticket.id))
        .filter(models.Ticket.created_at >= thirty_days_ago)
        .group_by(models.Ticket.category)
        .all()
    )
    tickets_by_category = {row[0].value: row[1] for row in cat_rows}

    # Weekly raised vs resolved (last 12 weeks)
    weekly_trend = []
    for i in range(11, -1, -1):
        week_start = datetime.datetime.utcnow() - datetime.timedelta(weeks=i + 1)
        week_end = datetime.datetime.utcnow() - datetime.timedelta(weeks=i)
        raised = db.query(func.count(models.Ticket.id)).filter(
            models.Ticket.created_at >= week_start,
            models.Ticket.created_at < week_end,
        ).scalar()
        resolved = db.query(func.count(models.Ticket.id)).filter(
            models.Ticket.resolved_at >= week_start,
            models.Ticket.resolved_at < week_end,
        ).scalar()
        weekly_trend.append({
            "week": week_start.strftime("%b %d"),
            "raised": raised or 0,
            "resolved": resolved or 0,
        })

    # Top 5 problem zones
    zone_rows = (
        db.query(models.Department, func.count(models.Ticket.id).label("open_count"))
        .join(models.Ticket, models.Ticket.department_id == models.Department.id)
        .filter(models.Ticket.status != models.TicketStatus.resolved)
        .group_by(models.Department.id)
        .order_by(func.count(models.Ticket.id).desc())
        .limit(5)
        .all()
    )
    top_problem_zones = [
        {"department": row.Department.name, "open_tickets": row.open_count}
        for row in zone_rows
    ]

    return schemas.AnalyticsSummary(
        tickets_by_category=tickets_by_category,
        weekly_trend=weekly_trend,
        top_problem_zones=top_problem_zones,
    )
