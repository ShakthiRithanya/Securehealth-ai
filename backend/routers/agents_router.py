from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from backend.database import get_db
from backend.models import AgentCommand, User
from backend.deps import require_admin, require_doctor_or_admin

router = APIRouter()


class ScanBody(BaseModel):
    ward: Optional[str] = None
    user_name: Optional[str] = None


class VoiceBody(BaseModel):
    transcript: str


class QueryBody(BaseModel):
    question: str


def fmt_cmd(c: AgentCommand):
    return {
        "id": c.id,
        "issued_by": c.issued_by,
        "agent": c.agent,
        "command_text": c.command_text,
        "result_summary": c.result_summary,
        "created_at": c.created_at,
    }


@router.post("/threat-hunter/scan")
async def th_scan(body: ScanBody, request: Request, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    from backend.agents.threat_hunter import scan
    mgr = request.app.state.ws_manager
    result = await scan(db, ward_filter=body.ward, user_name_filter=body.user_name, triggered_by_id=admin.id, ws_manager=mgr)
    return result


@router.post("/threat-hunter/voice")
async def th_voice(body: VoiceBody, request: Request, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    from backend.agents.threat_hunter import parse_voice_command, scan, lock_user
    mgr = request.app.state.ws_manager
    cmd = parse_voice_command(body.transcript)

    if cmd["action"] == "lock" and cmd.get("user_id"):
        result = await lock_user(db, cmd["user_id"], admin.id, mgr)
    else:
        result = await scan(
            db,
            ward_filter=cmd.get("ward"),
            user_name_filter=cmd.get("user_name"),
            triggered_by_id=admin.id,
            ws_manager=mgr,
        )
    return {"transcript": body.transcript, "parsed": cmd, "result": result}


@router.get("/threat-hunter/status")
def th_status(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    last = (
        db.query(AgentCommand)
        .filter(AgentCommand.agent == "threat_hunter")
        .order_by(AgentCommand.created_at.desc())
        .first()
    )
    if not last:
        return {"status": "no scans yet"}
    return fmt_cmd(last)


@router.post("/privacy-query/ask")
def pq_ask(body: QueryBody, db: Session = Depends(get_db), user: User = Depends(require_doctor_or_admin)):
    from backend.agents.privacy_query import ask
    return ask(db, body.question, user)


@router.post("/privacy-query/voice")
def pq_voice(body: VoiceBody, db: Session = Depends(get_db), user: User = Depends(require_doctor_or_admin)):
    from backend.agents.privacy_query import ask
    result = ask(db, body.transcript, user)
    return {"transcript": body.transcript, "result": result}


@router.get("/commands")
def command_history(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    rows = db.query(AgentCommand).order_by(AgentCommand.created_at.desc()).limit(100).all()
    return [fmt_cmd(r) for r in rows]
