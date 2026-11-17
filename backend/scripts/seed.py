"""
Seed script — populates the database with realistic demo data.
Run: python -m scripts.seed  (from /app inside the backend container)
  or: cd backend && python -m scripts.seed  (locally with DB running)
"""
import os
import sys
import math
import random
import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))
except ImportError:
    pass  # dotenv not installed; rely on environment variables

from app.db import SessionLocal, engine, Base
from app import models
from app.dependencies import hash_password
from app.config.gamification import BADGES, POINTS
from app.config.campus import is_inside_campus

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ── Departments / Zones ───────────────────────────────────────────────────────
# Coordinates are anchored inside the verified CSJMU campus polygon
# (OSM way 506689489, Kanpur).  All 10 points have been validated with
# is_inside_campus() before committing to this list.
DEPARTMENTS = [
    {"name": "Computer Science Block",   "type": "academic", "lat": 26.5060, "lng": 80.2710},
    {"name": "Engineering Block",        "type": "academic", "lat": 26.5045, "lng": 80.2700},
    {"name": "Science & Research Block", "type": "academic", "lat": 26.5035, "lng": 80.2680},
    {"name": "Administration Block",     "type": "academic", "lat": 26.5020, "lng": 80.2660},
    {"name": "Safety & Maintenance",     "type": "academic", "lat": 26.5010, "lng": 80.2650},
    {"name": "Hostel Block A",           "type": "hostel",   "lat": 26.5050, "lng": 80.2690},
    {"name": "Hostel Block B",           "type": "hostel",   "lat": 26.5055, "lng": 80.2680},
    {"name": "Hostel Block C",           "type": "hostel",   "lat": 26.5065, "lng": 80.2700},
    {"name": "Hostel Block D",           "type": "hostel",   "lat": 26.5040, "lng": 80.2720},
    {"name": "Girls Hostel",             "type": "hostel",   "lat": 26.5030, "lng": 80.2695},
]

existing_depts = db.query(models.Department).count()
if existing_depts == 0:
    for d in DEPARTMENTS:
        dept = models.Department(
            name=d["name"],
            type=models.DepartmentType(d["type"]),
            lat=d["lat"],
            lng=d["lng"],
        )
        db.add(dept)
    db.commit()
    print(f"✓ {len(DEPARTMENTS)} departments seeded")
else:
    print("  Departments already seeded, skipping")

depts = db.query(models.Department).all()
dept_map = {d.name: d for d in depts}

# ── Badges ────────────────────────────────────────────────────────────────────
existing_badges = db.query(models.Badge).count()
if existing_badges == 0:
    for b in BADGES:
        db.add(models.Badge(**b))
    db.commit()
    print(f"✓ {len(BADGES)} badges seeded")

# ── Users ─────────────────────────────────────────────────────────────────────
USERS = [
    {"name": "Admin",    "email": "admin@ecolens.in", "role": "admin",   "dept": None},
    {"name": "User",     "email": "user@ecolens.in",  "role": "student", "dept": "Computer Science Block"},
]

existing_users = db.query(models.User).count()
if existing_users == 0:
    for u in USERS:
        dept_id = dept_map[u["dept"]].id if u["dept"] else None
        db.add(models.User(
            name=u["name"],
            email=u["email"],
            hashed_password=hash_password("password123"),
            role=models.UserRole(u["role"]),
            department_id=dept_id,
        ))
    db.commit()
    print(f"✓ {len(USERS)} users seeded  (password: password123)")
else:
    print("  Users already seeded, skipping")

users = db.query(models.User).all()
student_users = [u for u in users if u.role in (models.UserRole.student, models.UserRole.staff)]

# ── Coordinate helper ─────────────────────────────────────────────────────────
def _random_campus_point(anchor_lat: float, anchor_lng: float,
                         jitter: float = 0.0010, max_tries: int = 20):
    """Return a (lat, lng) pair near the anchor that is strictly inside the
    CSJMU campus polygon.  Uses reject-and-retry; falls back to the anchor
    itself (which is guaranteed inside) if every random attempt lands outside.
    """
    for _ in range(max_tries):
        lat = anchor_lat + random.uniform(-jitter, jitter)
        lng = anchor_lng + random.uniform(-jitter, jitter)
        if is_inside_campus(lat, lng):
            return lat, lng
    # Anchor is validated at definition time — always safe as a fallback.
    return anchor_lat, anchor_lng


# ── Tickets ───────────────────────────────────────────────────────────────────
CATEGORIES = list(models.TicketCategory)
STATUSES = [models.TicketStatus.raised, models.TicketStatus.in_progress, models.TicketStatus.resolved]
STATUS_WEIGHTS = [0.3, 0.4, 0.3]
CAT_WEIGHTS = [0.40, 0.30, 0.05, 0.20, 0.05]

from app.config.gamification import ACTION_MAP

existing_tickets = db.query(models.Ticket).count()
if existing_tickets == 0:
    tickets_added = 0
    for _ in range(150):
        dept = random.choice(depts)
        reporter = random.choice(student_users)
        cat = random.choices(CATEGORIES, weights=CAT_WEIGHTS)[0]
        status = random.choices(STATUSES, weights=STATUS_WEIGHTS)[0]
        days_ago = random.randint(0, 90)
        created_at = datetime.datetime.utcnow() - datetime.timedelta(days=days_ago)
        resolved_at = created_at + datetime.timedelta(hours=random.randint(2, 48)) if status == models.TicketStatus.resolved else None

        # Random lat/lng near dept centre — validated inside CSJMU polygon
        lat, lng = _random_campus_point(dept.lat, dept.lng)

        info = ACTION_MAP[cat.value]
        ticket = models.Ticket(
            reporter_id=reporter.id,
            department_id=dept.id,
            category=cat,
            action_recommendation=info["action"],
            eco_tip=info["tip"],
            lat=lat,
            lng=lng,
            status=status,
            ai_confidence=round(random.uniform(0.62, 0.95), 2),
            created_at=created_at,
            updated_at=created_at,
            resolved_at=resolved_at,
        )
        db.add(ticket)
        tickets_added += 1
    db.commit()
    print(f"✓ {tickets_added} tickets seeded")
else:
    print("  Tickets already seeded, skipping")

# ── Reward Points (consistent with tickets) ────────────────────────────────────
existing_rp = db.query(models.RewardPoint).count()
if existing_rp == 0:
    all_tickets = db.query(models.Ticket).all()
    for t in all_tickets:
        db.add(models.RewardPoint(
            user_id=t.reporter_id,
            points=POINTS["report_submitted"],
            reason="report_submitted",
            ticket_id=t.id,
            created_at=t.created_at,
        ))
        if t.status == models.TicketStatus.resolved:
            db.add(models.RewardPoint(
                user_id=t.reporter_id,
                points=POINTS["ticket_resolved"],
                reason="ticket_resolved",
                ticket_id=t.id,
                created_at=t.resolved_at or t.created_at,
            ))
    db.commit()

    # Update user point totals
    for user in users:
        total = db.query(models.RewardPoint).filter(models.RewardPoint.user_id == user.id).all()
        user.total_points = sum(rp.points for rp in total)
        # Simple sustainability score
        tc = db.query(models.Ticket).filter(models.Ticket.reporter_id == user.id).count()
        user.sustainability_score = round(min(tc / 50.0, 1.0) * 100, 1)
    db.commit()
    print("✓ Reward points + user scores updated")

# ── User Badges ────────────────────────────────────────────────────────────────
existing_ub = db.query(models.UserBadge).count()
if existing_ub == 0:
    badges = db.query(models.Badge).all()
    for user in users:
        for badge in badges:
            if user.total_points >= badge.threshold_points:
                db.add(models.UserBadge(user_id=user.id, badge_id=badge.id))
    db.commit()
    print("✓ User badges awarded")

# ── Sensor Readings ────────────────────────────────────────────────────────────
existing_sr = db.query(models.SensorReading).count()
if existing_sr == 0:
    import math as m
    now = datetime.datetime.utcnow()
    readings_added = 0
    # 7 days × 24 hours per building × 4 metrics
    for dept in depts:
        is_hostel = dept.type == models.DepartmentType.hostel
        for day_offset in range(30):
            for hour in range(0, 24, 3):  # every 3 hours
                ts = now - datetime.timedelta(days=day_offset, hours=hour)
                hour_of_day = ts.hour
                weekday = ts.weekday()  # 0=Mon

                # Occupancy factor
                if is_hostel:
                    # Peak evenings (18-23h) and weekends
                    occ = 0.8 if hour_of_day >= 18 or hour_of_day <= 6 else 0.3
                else:
                    # Peak business hours (9-17h) weekdays
                    occ = 0.85 if (9 <= hour_of_day <= 17 and weekday < 5) else 0.15

                noise = lambda scale: random.gauss(0, scale * 0.05)

                electricity = round(max(0.5, occ * 120 + noise(120)), 2)  # kWh
                water = round(max(0.1, occ * 80 + noise(80)), 2)           # litres × 100
                devices = round(max(0, occ * 200 + noise(200)))             # count
                bandwidth = round(max(0, occ * 350 + noise(350)), 1)       # Mbps

                for metric, value in [
                    (models.MetricType.electricity, electricity),
                    (models.MetricType.water, water),
                    (models.MetricType.devices, devices),
                    (models.MetricType.bandwidth, bandwidth),
                ]:
                    db.add(models.SensorReading(
                        department_id=dept.id,
                        metric=metric,
                        value=value,
                        recorded_at=ts,
                    ))
                    readings_added += 1

    db.commit()
    print(f"✓ {readings_added} sensor readings seeded")
else:
    print("  Sensor readings already seeded, skipping")

db.close()
print("\n✅ Seed complete!")
print("\nDemo login credentials (password: password123):")
print("  admin@ecolens.in  → Admin")
print("  user@ecolens.in   → User (Student)")
