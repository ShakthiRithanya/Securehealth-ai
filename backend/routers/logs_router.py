from datetime import datetime
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from backend.database import get_db
from backend.models import AccessLog, User
from backend.deps import get_current_user, require_admin

router = APIRouter()


class LogCreate(BaseModel):
    patient_id: Optional[int] = None
    action: str
    resource: str
    ip_address: Optional[str] = "unknown"


def fmt(lg: AccessLog):
    return {
        "id": lg.id,
        "user_id": lg.user_id,
        "user_name": lg.user.name if lg.user else f"User #{lg.user_id}",
        "patient_id": lg.patient_id,
        "action": lg.action,
        "resource": lg.resource,
        "ip_address": lg.ip_address,
        "timestamp": lg.timestamp,
        "anomaly_score": lg.anomaly_score,
        "flagged": lg.flagged,
    }


@router.get("/my")
def my_logs(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    limit: int = Query(100, le=500),
):
    rows = (
        db.query(AccessLog)
        .filter(AccessLog.user_id == user.id)
        .order_by(AccessLog.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [fmt(r) for r in rows]


def _dedup(rows):
    seen = []
    for r in rows:
        if seen:
            prev = seen[-1]
            same_user = prev["user_id"] == r["user_id"]
            same_action = prev["action"] == r["action"]
            same_resource = prev["resource"] == r["resource"]
            time_diff = abs((prev["timestamp"] - r["timestamp"]).total_seconds())
            if same_user and same_action and same_resource and time_diff <= 60:
                prev["count"] = prev.get("count", 1) + 1
                continue
        entry = fmt(r)
        entry["count"] = 1
        seen.append(entry)
    return seen


@router.get("/")
def all_logs(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    flagged: Optional[int] = Query(None),
    from_dt: Optional[str] = Query(None),
    to_dt: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
):
    q = db.query(AccessLog)
    if user_id is not None:
        q = q.filter(AccessLog.user_id == user_id)
    if action:
        q = q.filter(AccessLog.action == action.upper())
    if flagged is not None:
        q = q.filter(AccessLog.flagged == flagged)
    if from_dt:
        q = q.filter(AccessLog.timestamp >= datetime.fromisoformat(from_dt))
    if to_dt:
        q = q.filter(AccessLog.timestamp <= datetime.fromisoformat(to_dt))
    rows = q.order_by(AccessLog.timestamp.desc()).limit(limit).all()
    return _dedup(rows)


@router.post("/")
def write_log(body: LogCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    lg = AccessLog(
        user_id=user.id,
        patient_id=body.patient_id,
        action=body.action.upper(),
        resource=body.resource,
        ip_address=body.ip_address,
    )
    db.add(lg)
    db.commit()
    db.refresh(lg)
    return fmt(lg)
