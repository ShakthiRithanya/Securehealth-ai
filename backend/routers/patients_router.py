import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from backend.database import get_db
from backend.models import Patient, User, AccessLog
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


class PatientEdit(BaseModel):
    age: Optional[int] = None
    ward: Optional[str] = None
    risk_score: Optional[float] = None
    state: Optional[str] = None


def fmt(p: Patient):
    return {
        "id": p.id,
        "name": p.name,
        "age": p.age,
        "ward": p.ward,
        "assigned_doctor_id": p.assigned_doctor_id,
        "assigned_doctor": p.doctor.name if p.doctor else None,
        "scheme_eligible": json.loads(p.scheme_eligible) if p.scheme_eligible else [],
        "risk_score": p.risk_score,
        "state": p.state,
        "created_at": p.created_at,
    }


async def _log_action(request: Request, db: Session, user: User, patient: Patient, action: str, resource: str):
    lg = AccessLog(
        user_id=user.id,
        patient_id=patient.id,
        action=action,
        resource=resource,
        ip_address=request.client.host if request.client else "unknown",
        timestamp=datetime.utcnow(),
        anomaly_score=0.0,
        flagged=0,
    )
    db.add(lg)
    db.commit()
    db.refresh(lg)

    ws_manager = request.app.state.ws_manager
    await ws_manager.broadcast({
        "event": "patient_action",
        "log_id": lg.id,
        "user_id": user.id,
        "user_name": user.name,
        "user_role": user.role,
        "patient_id": patient.id,
        "patient_name": patient.name,
        "patient_ward": patient.ward,
        "action": action,
        "resource": resource,
        "timestamp": lg.timestamp.isoformat(),
    })
    return lg


@router.get("/risk-summary")
def risk_summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Patient)
    if user.role == "nurse":
        wards = [w.strip() for w in (user.department or "").split(",") if w.strip()]
        if wards:
            q = q.filter(Patient.ward.in_(wards))
    patients = q.all()
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


def nurse_wards(user: User):
    if user.role == "nurse" and user.department:
        return [w.strip() for w in user.department.split(",") if w.strip()]
    return []


@router.get("/")
def list_patients(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    ward: Optional[str] = None,
    search: Optional[str] = None,
):
    q = db.query(Patient)
    if user.role == "nurse":
        wards = nurse_wards(user)
        if wards:
            q = q.filter(Patient.ward.in_(wards))
    if ward:
        q = q.filter(Patient.ward.ilike(f"%{ward}%"))
    if search:
        q = q.filter(Patient.name.ilike(f"%{search}%"))
    return [fmt(p) for p in q.order_by(Patient.name).all()]


@router.get("/{pid}")
async def get_patient(
    pid: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    p = db.query(Patient).filter(Patient.id == pid).first()
    if not p:
        raise HTTPException(status_code=404, detail="patient not found")
    if user.role == "nurse" and p.ward not in nurse_wards(user):
        raise HTTPException(status_code=403, detail="access restricted to your assigned wards")
    await _log_action(request, db, user, p, "VIEW", "patient_record")
    return fmt(p)


@router.post("/{pid}/export")
async def export_patient(
    pid: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    p = db.query(Patient).filter(Patient.id == pid).first()
    if not p:
        raise HTTPException(status_code=404, detail="patient not found")
    if user.role == "nurse" and p.ward not in nurse_wards(user):
        raise HTTPException(status_code=403, detail="access restricted to your assigned wards")
    await _log_action(request, db, user, p, "EXPORT", "patient_record")
    return fmt(p)


@router.patch("/{pid}")
async def edit_patient(
    pid: int,
    body: PatientEdit,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    p = db.query(Patient).filter(Patient.id == pid).first()
    if not p:
        raise HTTPException(status_code=404, detail="patient not found")
    if user.role == "nurse" and p.ward not in nurse_wards(user):
        raise HTTPException(status_code=403, detail="access restricted to your assigned wards")
    
    if user.role == "nurse":
        if body.ward is not None or body.risk_score is not None:
            raise HTTPException(status_code=403, detail="Nurses are not allowed to edit ward or risk score")

    if body.age is not None:
        p.age = body.age
    if body.ward is not None:
        p.ward = body.ward
    if body.risk_score is not None:
        p.risk_score = body.risk_score
    if body.state is not None:
        p.state = body.state
    db.commit()
    db.refresh(p)
    await _log_action(request, db, user, p, "EDIT", "patient_record")
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
