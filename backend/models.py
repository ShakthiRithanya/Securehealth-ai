from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)
    department = Column(String, nullable=True)
    is_locked = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    logs = relationship("AccessLog", back_populates="user", foreign_keys="AccessLog.user_id")
    alerts = relationship("Alert", back_populates="user")
    commands = relationship("AgentCommand", back_populates="issued_by_user")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer)
    ward = Column(String)
    assigned_doctor_id = Column(Integer, ForeignKey("users.id"))
    scheme_eligible = Column(Text)
    risk_score = Column(Float, default=0.0)
    state = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    doctor = relationship("User", foreign_keys=[assigned_doctor_id])
    logs = relationship("AccessLog", back_populates="patient")


class AccessLog(Base):
    __tablename__ = "access_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    action = Column(String)
    resource = Column(String)
    ip_address = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    anomaly_score = Column(Float, default=0.0)
    flagged = Column(Integer, default=0)

    user = relationship("User", back_populates="logs", foreign_keys=[user_id])
    patient = relationship("Patient", back_populates="logs")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    alert_type = Column(String)
    severity = Column(String)
    details = Column(Text)
    resolved = Column(Integer, default=0)
    auto_locked = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="alerts")


class AgentCommand(Base):
    __tablename__ = "agent_commands"

    id = Column(Integer, primary_key=True, index=True)
    issued_by = Column(Integer, ForeignKey("users.id"))
    agent = Column(String)
    command_text = Column(Text)
    result_summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    issued_by_user = relationship("User", back_populates="commands")


class SchemeMapping(Base):
    __tablename__ = "scheme_mappings"

    id = Column(Integer, primary_key=True, index=True)
    scheme_name = Column(String)
    state = Column(String)
    eligibility_criteria = Column(Text)
    benefit_amount = Column(Float)
