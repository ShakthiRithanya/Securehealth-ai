import re
import json
from datetime import datetime, timedelta

import pandas as pd

from backend.models import AccessLog, Alert, AgentCommand, User, Patient
from backend.ml.predictor import score_users
from backend.config import ANOMALY_MEDIUM, ANOMALY_HIGH, ANOMALY_CRITICAL


def parse_voice_command(transcript):
    txt = transcript.lower().strip()
    cmd = {"action": "scan", "ward": None, "user_name": None, "user_id": None}

    lock_match = re.search(r"lock\s+(?:user\s+)?(\d+)", txt)
    if lock_match:
        cmd["action"] = "lock"
        cmd["user_id"] = int(lock_match.group(1))
        return cmd

    if "lock" in txt:
        cmd["action"] = "lock"
        name_match = re.search(r"lock\s+(?:dr\.?\s*|doctor\s+)?([a-z]+)", txt)
        if name_match:
            cmd["user_name"] = name_match.group(1)
        return cmd

    ward_match = re.search(r"ward\s+([a-z0-9]+)", txt)
    if ward_match:
        cmd["ward"] = ward_match.group(1)

    doc_match = re.search(r"(?:dr\.?\s*|doctor\s+)([a-z]+)", txt)
    if doc_match:
        cmd["user_name"] = doc_match.group(1)

    return cmd


def _severity(score):
    if score >= ANOMALY_CRITICAL:
        return "critical"
    if score >= ANOMALY_HIGH:
        return "high"
    return "medium"


def _safe_dict(h):
    out = {}
    for k, v in h.items():
        if hasattr(v, "item"):
            out[k] = v.item()
        elif hasattr(v, "isoformat"):
            out[k] = v.isoformat()
        else:
            out[k] = v
    return out


async def scan(db, ward_filter=None, user_name_filter=None, triggered_by_id=None, ws_manager=None):
    cutoff = datetime.utcnow() - timedelta(hours=2)
    q = db.query(AccessLog).filter(AccessLog.timestamp >= cutoff)

    if ward_filter:
        pid_list = [
            p.id for p in db.query(Patient).filter(Patient.ward.ilike(f"%{ward_filter}%")).all()
        ]
        q = q.filter(AccessLog.patient_id.in_(pid_list)) if pid_list else q.filter(AccessLog.id == -1)

    if user_name_filter:
        uid_list = [
            u.id for u in db.query(User).filter(User.name.ilike(f"%{user_name_filter}%")).all()
        ]
        q = q.filter(AccessLog.user_id.in_(uid_list)) if uid_list else q.filter(AccessLog.id == -1)

    log_rows = q.all()

    if not log_rows:
        note = "no logs in scan window"
        db.add(AgentCommand(
            issued_by=triggered_by_id,
            agent="threat_hunter",
            command_text=f"scan ward={ward_filter} user={user_name_filter}",
            result_summary=note,
        ))
        db.commit()
        return {"alerts_created": 0, "users_locked": 0, "logs_scanned": 0, "summary": note}

    all_users = db.query(User).all()

    logs_df = pd.DataFrame([{
        "user_id": r.user_id,
        "patient_id": r.patient_id,
        "action": r.action,
        "resource": r.resource,
        "ip_address": r.ip_address,
        "timestamp": r.timestamp,
        "flagged": r.flagged,
    } for r in log_rows])

    users_df = pd.DataFrame([{
        "id": u.id,
        "role": u.role,
        "department": u.department,
    } for u in all_users])

    hits = score_users(logs_df, users_df)

    alerts_created = 0
    locked_count = 0

    for h in hits:
        score = h["anomaly_score"]
        if score < ANOMALY_MEDIUM:
            continue

        sev = _severity(score)
        auto_lock = 0

        if score >= ANOMALY_CRITICAL:
            target = db.query(User).filter(User.id == h["user_id"]).first()
            if target and not target.is_locked:
                target.is_locked = 1
                auto_lock = 1
                locked_count += 1

        atype = "rapid_access" if h.get("access_count", 0) > 10 else "anomaly_detected"
        alert = Alert(
            user_id=h["user_id"],
            alert_type=atype,
            severity=sev,
            details=json.dumps(_safe_dict(h)),
            resolved=0,
            auto_locked=auto_lock,
        )
        db.add(alert)
        db.flush()
        alerts_created += 1

        if ws_manager:
            await ws_manager.broadcast({
                "event": "new_alert",
                "alert_id": alert.id,
                "user_id": h["user_id"],
                "severity": sev,
                "anomaly_score": score,
                "auto_locked": auto_lock,
                "created_at": alert.created_at.isoformat(),
            })

    summary = f"scanned {len(log_rows)} logs; {alerts_created} alerts; {locked_count} locked"

    db.add(AgentCommand(
        issued_by=triggered_by_id,
        agent="threat_hunter",
        command_text=f"scan ward={ward_filter} user={user_name_filter}",
        result_summary=summary,
    ))
    db.commit()

    return {
        "alerts_created": alerts_created,
        "users_locked": locked_count,
        "logs_scanned": len(log_rows),
        "summary": summary,
    }


async def lock_user(db, user_id, triggered_by_id, ws_manager=None):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        return {"error": "user not found"}

    if target.is_locked:
        return {"message": "already locked", "user_id": user_id}

    target.is_locked = 1

    alert = Alert(
        user_id=user_id,
        alert_type="manual_lock",
        severity="high",
        details=json.dumps({"triggered_by": triggered_by_id, "reason": "manual admin command"}),
        resolved=0,
        auto_locked=1,
    )
    db.add(alert)
    db.flush()

    db.add(AgentCommand(
        issued_by=triggered_by_id,
        agent="threat_hunter",
        command_text=f"lock user {user_id}",
        result_summary=f"user {user_id} manually locked",
    ))
    db.commit()

    if ws_manager:
        await ws_manager.broadcast({
            "event": "user_locked",
            "user_id": user_id,
            "alert_id": alert.id,
            "severity": "high",
            "created_at": alert.created_at.isoformat(),
        })

    return {"locked": True, "user_id": user_id, "alert_id": alert.id}
 
