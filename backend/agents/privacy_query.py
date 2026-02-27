import json
from datetime import datetime

from backend.models import Patient, AgentCommand
from backend.agents.gemini_client import ask_gemini


def build_context(db, requesting_user):
    q = db.query(Patient)

    if requesting_user.role == "doctor":
        q = q.filter(Patient.assigned_doctor_id == requesting_user.id)
    elif requesting_user.role == "nurse":
        if requesting_user.department:
            q = q.filter(Patient.ward == requesting_user.department)

    patients = q.all()
    total = len(patients)

    if total == 0:
        return {"total_patients": 0}

    avg_risk = round(sum(p.risk_score for p in patients) / total, 3)

    buckets = {"low": 0, "medium": 0, "high": 0}
    scheme_counts = {}
    state_counts = {}
    ward_counts = {}

    for p in patients:
        if p.risk_score < 0.35:
            buckets["low"] += 1
        elif p.risk_score < 0.65:
            buckets["medium"] += 1
        else:
            buckets["high"] += 1

        state_counts[p.state] = state_counts.get(p.state, 0) + 1
        ward_counts[p.ward] = ward_counts.get(p.ward, 0) + 1

        schemes = json.loads(p.scheme_eligible) if p.scheme_eligible else []
        for s in schemes:
            scheme_counts[s] = scheme_counts.get(s, 0) + 1

    scheme_pct = {s: round(c / total * 100, 1) for s, c in scheme_counts.items()}

    return {
        "total_patients": total,
        "avg_risk_score": avg_risk,
        "risk_buckets": buckets,
        "scheme_eligibility_pct": scheme_pct,
        "state_distribution": state_counts,
        "ward_distribution": ward_counts,
    }


def ask(db, question, requesting_user):
    ctx = build_context(db, requesting_user)

    ctx_lines = []
    for k, v in ctx.items():
        if isinstance(v, dict):
            ctx_lines.append(f"{k}:")
            for sub_k, sub_v in v.items():
                ctx_lines.append(f"  {sub_k}: {sub_v}")
        else:
            ctx_lines.append(f"{k}: {v}")
    ctx_text = "\n".join(ctx_lines)

    sys_prompt = (
        "You are a privacy-preserving medical analytics assistant deployed in an Indian hospital. "
        "Answer only using the aggregate statistics provided in the context. "
        "Do not invent individual patient details, names, Aadhaar numbers, or personal stories. "
        "All data is de-identified. Be concise and clinically precise. "
        f"The requesting user is a {requesting_user.role} "
        f"in department: {requesting_user.department or 'unassigned'}."
    )

    reply = ask_gemini(sys_prompt, ctx_text, question)
    snippet = reply[:200] if len(reply) > 200 else reply

    db.add(AgentCommand(
        issued_by=requesting_user.id,
        agent="privacy_query",
        command_text=question,
        result_summary=snippet,
    ))
    db.commit()

    return {
        "answer": reply,
        "context_summary": {
            "total_patients": ctx.get("total_patients", 0),
            "risk_buckets": ctx.get("risk_buckets", {}),
            "scheme_eligibility_pct": ctx.get("scheme_eligibility_pct", {}),
        },
        "timestamp": datetime.utcnow().isoformat(),
    }
 
