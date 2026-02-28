from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Alert, User
from backend.deps import require_admin

router = APIRouter()


def fmt(a: Alert):
    return {
        "id": a.id,
        "user_id": a.user_id,
        "user_name": a.user.name if a.user else f"User #{a.user_id}",
        "alert_type": a.alert_type,
        "severity": a.severity,
        "details": a.details,
        "resolved": a.resolved,
        "auto_locked": a.auto_locked,
        "created_at": a.created_at,
    }


@router.get("/")
def list_alerts(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    rows = (
        db.query(Alert)
        .filter(Alert.resolved == 0)
        .order_by(Alert.created_at.desc())
        .all()
    )
    return [fmt(r) for r in rows]


@router.post("/{aid}/resolve")
def resolve_alert(aid: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    a = db.query(Alert).filter(Alert.id == aid).first()
    if not a:
        raise HTTPException(status_code=404, detail="alert not found")
    a.resolved = 1
    db.commit()
    return {"id": a.id, "resolved": 1}
