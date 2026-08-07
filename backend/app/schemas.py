from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models import UserRole, TicketStatus, TicketCategory, MetricType, DepartmentType


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    department_id: Optional[int]
    total_points: int
    sustainability_score: float
    model_config = {"from_attributes": True}


# ── Department ────────────────────────────────────────────────────────────────

class DepartmentOut(BaseModel):
    id: int
    name: str
    type: DepartmentType
    lat: float
    lng: float
    model_config = {"from_attributes": True}


# ── Ticket ────────────────────────────────────────────────────────────────────

class TicketOut(BaseModel):
    id: int
    reporter_id: int
    department_id: int
    category: TicketCategory
    action_recommendation: str
    eco_tip: Optional[str]
    image_url: Optional[str]
    lat: float
    lng: float
    status: TicketStatus
    ai_confidence: Optional[float]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    reporter: Optional[UserOut]
    department: Optional[DepartmentOut]
    model_config = {"from_attributes": True}

class TicketStatusUpdate(BaseModel):
    status: TicketStatus

class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    weight: float


# ── AI ────────────────────────────────────────────────────────────────────────

class ClassifyResponse(BaseModel):
    category: TicketCategory
    confidence: float
    action_recommendation: str
    eco_tip: str


# ── Gamification ──────────────────────────────────────────────────────────────

class BadgeOut(BaseModel):
    id: int
    name: str
    description: str
    threshold_points: int
    icon: str
    model_config = {"from_attributes": True}

class UserBadgeOut(BaseModel):
    badge: BadgeOut
    awarded_at: datetime
    model_config = {"from_attributes": True}

class LeaderboardUser(BaseModel):
    rank: int
    user_id: int
    name: str
    department: Optional[str]
    total_points: int
    sustainability_score: float

class LeaderboardDepartment(BaseModel):
    rank: int
    department_id: int
    name: str
    type: DepartmentType
    total_points: int
    member_count: int

class RecommendationOut(BaseModel):
    tips: List[str]


# ── Sensor / Router ───────────────────────────────────────────────────────────

class SensorReadingOut(BaseModel):
    recorded_at: datetime
    value: float
    model_config = {"from_attributes": True}

class RouterSnapshotOut(BaseModel):
    department_id: int
    devices: Optional[float]
    bandwidth: Optional[float]

class AnomalyOut(BaseModel):
    department_id: int
    department_name: str
    metric: MetricType
    recorded_at: datetime
    value: float
    expected_mean: float
    z_score: float


# ── Analytics ─────────────────────────────────────────────────────────────────

class AnalyticsSummary(BaseModel):
    tickets_by_category: dict
    weekly_trend: List[dict]
    top_problem_zones: List[dict]
