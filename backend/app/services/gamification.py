"""
Gamification service — points, badge unlocks, sustainability score, recommendations.
"""
import datetime
from sqlalchemy.orm import Session
from app import models
from app.config.gamification import POINTS, BADGES


def award_points(user_id: int, reason: str, db: Session, ticket_id: int = None) -> int:
    pts = POINTS.get(reason, 0)
    if pts == 0:
        return 0

    rp = models.RewardPoint(
        user_id=user_id,
        points=pts,
        reason=reason,
        ticket_id=ticket_id,
    )
    db.add(rp)

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.total_points += pts
        user.sustainability_score = _compute_score(user, db)

    db.commit()
    check_badge_unlocks(user_id, db)
    return pts


def check_badge_unlocks(user_id: int, db: Session):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return

    earned_badge_ids = {ub.badge_id for ub in user.badges}
    badges = db.query(models.Badge).all()

    for badge in badges:
        if badge.id not in earned_badge_ids and user.total_points >= badge.threshold_points:
            ub = models.UserBadge(user_id=user_id, badge_id=badge.id)
            db.add(ub)

    db.commit()


def _compute_score(user: models.User, db: Session) -> float:
    """
    Sustainability score 0–100:
      - report_frequency  40%  (tickets raised, capped at 50)
      - resolution_rate   30%  (resolved / total tickets in user's dept)
      - badge_count       20%  (badges earned, capped at 5)
      - streak            10%  (reported at least once today = full streak pts)
    """
    ticket_count = db.query(models.Ticket).filter(
        models.Ticket.reporter_id == user.id
    ).count()
    report_score = min(ticket_count / 50.0, 1.0) * 40

    if user.department_id:
        total = db.query(models.Ticket).filter(
            models.Ticket.department_id == user.department_id
        ).count()
        resolved = db.query(models.Ticket).filter(
            models.Ticket.department_id == user.department_id,
            models.Ticket.status == models.TicketStatus.resolved,
        ).count()
        resolution_score = (resolved / total * 30) if total > 0 else 0
    else:
        resolution_score = 0

    badge_count = db.query(models.UserBadge).filter(
        models.UserBadge.user_id == user.id
    ).count()
    badge_score = min(badge_count / 5.0, 1.0) * 20

    today = datetime.datetime.utcnow().date()
    streak_today = db.query(models.Ticket).filter(
        models.Ticket.reporter_id == user.id,
        models.Ticket.created_at >= datetime.datetime(today.year, today.month, today.day),
    ).count()
    streak_score = 10 if streak_today > 0 else 0

    return round(report_score + resolution_score + badge_score + streak_score, 1)


def get_recommendations(user_id: int, db: Session) -> list[str]:
    """
    Rule-based: find the 3 waste categories the user has reported least
    vs. campus-wide frequency. Return tip strings.
    """
    from app.config.gamification import ACTION_MAP

    all_cats = [c.value for c in models.TicketCategory]

    user_counts = {c: 0 for c in all_cats}
    for t in db.query(models.Ticket).filter(models.Ticket.reporter_id == user_id).all():
        user_counts[t.category.value] += 1

    global_counts = {c: 0 for c in all_cats}
    for t in db.query(models.Ticket).all():
        global_counts[t.category.value] += 1

    # Sort by how much less the user reported vs. global average
    total_global = sum(global_counts.values()) or 1
    scores = {}
    for c in all_cats:
        global_ratio = global_counts[c] / total_global
        user_ratio = (user_counts[c] / max(sum(user_counts.values()), 1))
        scores[c] = global_ratio - user_ratio  # positive = user underreports this

    top3 = sorted(scores, key=lambda x: -scores[x])[:3]
    tips = []
    for cat in top3:
        action_info = ACTION_MAP.get(cat, {})
        tips.append(f"🔍 Look out for {cat.replace('_', ' ')} waste: {action_info.get('tip', '')}")

    return tips
