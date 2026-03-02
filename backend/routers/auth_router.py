from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json
from backend.database import get_db
from backend.models import User, AccessLog, Alert
from backend.auth import verify_password, create_token
from backend.deps import get_current_user
router = APIRouter()
@router.post("/login")
async def login(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="invalid credentials")
    if user.is_locked:
        raise HTTPException(status_code=403, detail="account locked")
    current_ip = request.client.host if request.client else "unknown"
    if user.role == "doctor":
        cutoff = datetime.utcnow() - timedelta(hours=1)
        recent_logins = db.query(AccessLog).filter(
            AccessLog.user_id == user.id,
            AccessLog.action == "LOGIN",
            AccessLog.timestamp >= cutoff
        ).all()
        for log in recent_logins:
            if log.ip_address != current_ip and log.ip_address not in ("unknown", "127.0.0.1", "::1", "localhost"):
                alert = Alert(
                    user_id=user.id,
                    alert_type="concurrent_ip_login",
                    severity="high",
                    details=json.dumps({"msg": "Concurrent Multi-IP Login Detected", "prior_ip": log.ip_address, "current_ip": current_ip}),
                    resolved=0,
                    auto_locked=0  # Just mark as an active alert, do not lock out
                )
                db.add(alert)
                db.flush()
                mgr = getattr(request.app.state, 'ws_manager', None)
                if mgr:
                    await mgr.broadcast({
                        "event": "new_alert",
                        "alert_id": alert.id,
                        "user_id": user.id,
                        "user_name": user.name,
                        "severity": "high",
                        "anomaly_score": 0.8,
                        "auto_locked": 0,
                        "created_at": alert.created_at.isoformat() if alert.created_at else datetime.utcnow().isoformat()
                    })
                break
    log_entry = AccessLog(
        user_id=user.id,
        action="LOGIN",
        resource="system",
        ip_address=current_ip,
        anomaly_score=0.0
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    
    mgr = getattr(request.app.state, 'ws_manager', None)
    if mgr:
        await mgr.broadcast({
            "event": "patient_action",
            "log_id": log_entry.id,
            "user_id": user.id,
            "user_name": user.name,
            "user_role": user.role,
            "patient_id": None,
            "patient_name": None,
            "patient_ward": None,
            "action": "LOGIN",
            "resource": "system",
            "timestamp": log_entry.timestamp.isoformat()
        })
    token = create_token({"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name,
        "user_id": user.id,
        "department": user.department,
        "specialization": user.specialization,
        "supervising_doctor_id": user.supervising_doctor_id,
        "supervising_doctor_name": user.supervisor.name if user.supervisor else None,
    }
@router.get("/me")
def me(current: User = Depends(get_current_user)):
    return {
        "id": current.id,
        "name": current.name,
        "email": current.email,
        "role": current.role,
        "department": current.department,
        "specialization": current.specialization,
        "is_locked": current.is_locked,
        "supervising_doctor_id": current.supervising_doctor_id,
        "supervising_doctor_name": current.supervisor.name if current.supervisor else None,
    }
