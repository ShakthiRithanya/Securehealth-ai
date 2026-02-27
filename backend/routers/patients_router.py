import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from backend.database import get_db
from backend.models import Patient, User
from backend.deps import get_current_user, require_admin

router = APIRouter()


class PatientCreate(BaseModel):
    name: str
    age: int
    ward: str
    assigned_doctor_id: int
    scheme_eligible: Optional[List[str]] = []
    risk_score: Optional[float] = 0.0
    state: Optional[str] = None


def fmt(p: Patient):
    return {
        "id": p.id,
        "name": p.name,
        "age": p.age,
        "ward": p.ward,
        "assigned_doctor_id": p.assigned_doctor_id,
        "scheme_eligible": json.loads(p.scheme_eligible) if p.scheme_eligible else [],
        "risk_score": p.risk_score,
        "state": p.state,
        "created_at": p.created_at,
    }


def scoped_query(db, user):
    q = db.query(Patient)
    if user.role == "doctor":
        q = q.filter(Patient.assigned_doctor_id == user.id)
    elif user.role == "nurse":
        if user.department:
            q = q.filter(Patient.ward == user.department)
    return q


@router.get("/risk-summary")
def risk_summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    patients = scoped_query(db, user).all()
    if not patients:
        return {"total": 0, "avg_risk": 0, "buckets": {}, "scheme_counts": {}}

    total = len(patients)
    avg_risk = round(sum(p.risk_score for p in patients) / total, 3)

    buckets = {"low": 0, "medium": 0, "high": 0}
    scheme_counts = {}
    ward_counts = {}

    for p in patients:
        if p.risk_score < 0.35:
            buckets["low"] += 1
        elif p.risk_score < 0.65:
            buckets["medium"] += 1
        else:
            buckets["high"] += 1

        ward_counts[p.ward] = ward_counts.get(p.ward, 0) + 1

        schemes = json.loads(p.scheme_eligible) if p.scheme_eligible else []
        for s in schemes:
            scheme_counts[s] = scheme_counts.get(s, 0) + 1

    return {
        "total": total,
        "avg_risk": avg_risk,
        "buckets": buckets,
        "scheme_counts": scheme_counts,
        "ward_counts": ward_counts,
    }


@router.get("/")
def list_patients(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [fmt(p) for p in scoped_query(db, user).all()]


@router.get("/{pid}")
def get_patient(pid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = scoped_query(db, user).filter(Patient.id == pid).first()
    if not p:
        raise HTTPException(status_code=404, detail="patient not found")
    return fmt(p)


@router.post("/")
def create_patient(body: PatientCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    doctor = db.query(User).filter(User.id == body.assigned_doctor_id, User.role == "doctor").first()
    if not doctor:
        raise HTTPException(status_code=400, detail="assigned doctor not found")
    p = Patient(
        name=body.name,
        age=body.age,
        ward=body.ward,
        assigned_doctor_id=body.assigned_doctor_id,
        scheme_eligible=json.dumps(body.scheme_eligible),
        risk_score=body.risk_score,
        state=body.state,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return fmt(p)
