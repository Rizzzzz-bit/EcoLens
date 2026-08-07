import enum
import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Enum as SAEnum,
    ForeignKey, Text, Boolean
)
from sqlalchemy.orm import relationship
from app.db import Base


class UserRole(str, enum.Enum):
    student = "student"
    staff = "staff"
    dept_staff = "dept_staff"
    warden = "warden"
    admin = "admin"


class TicketStatus(str, enum.Enum):
    raised = "raised"
    in_progress = "in_progress"
    resolved = "resolved"


class TicketCategory(str, enum.Enum):
    organic = "organic"
    recyclable = "recyclable"
    hazardous = "hazardous"
    general_waste = "general_waste"
    resource_wastage = "resource_wastage"


class MetricType(str, enum.Enum):
    electricity = "electricity"
    water = "water"
    devices = "devices"
    bandwidth = "bandwidth"


class DepartmentType(str, enum.Enum):
    academic = "academic"
    hostel = "hostel"


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    type = Column(SAEnum(DepartmentType), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    tickets = relationship("Ticket", back_populates="department")
    users = relationship("User", back_populates="department")
    sensor_readings = relationship("SensorReading", back_populates="department")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.student)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    total_points = Column(Integer, default=0)
    sustainability_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    department = relationship("Department", back_populates="users")
    tickets = relationship("Ticket", back_populates="reporter")
    reward_points = relationship("RewardPoint", back_populates="user")
    badges = relationship("UserBadge", back_populates="user")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    category = Column(SAEnum(TicketCategory), nullable=False)
    action_recommendation = Column(Text, nullable=False)
    eco_tip = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    status = Column(SAEnum(TicketStatus), nullable=False, default=TicketStatus.raised)
    ai_confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    reporter = relationship("User", back_populates="tickets")
    department = relationship("Department", back_populates="tickets")
    reward_points = relationship("RewardPoint", back_populates="ticket")


class RewardPoint(Base):
    __tablename__ = "reward_points"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    points = Column(Integer, nullable=False)
    reason = Column(String, nullable=False)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="reward_points")
    ticket = relationship("Ticket", back_populates="reward_points")


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=False)
    threshold_points = Column(Integer, nullable=False)
    icon = Column(String, default="🏅")

    user_badges = relationship("UserBadge", back_populates="badge")


class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id"), nullable=False)
    awarded_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="badges")
    badge = relationship("Badge", back_populates="user_badges")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    metric = Column(SAEnum(MetricType), nullable=False)
    value = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)

    department = relationship("Department", back_populates="sensor_readings")
