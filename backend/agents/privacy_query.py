import json
from datetime import datetime
from backend.models import Patient, AgentCommand
from backend.agents.gemini_client import ask_gemini
def build_context(db, requesting_user):
    pq = db.query(Patient)
    if requesting_user.role == "doctor":
        pq = pq.filter(Patient.assigned_doctor_id == requesting_user.id)
    elif requesting_user.role == "nurse":
        if requesting_user.department:
            pq = pq.filter(Patient.ward == requesting_user.department)
    patients = pq.all()
    patient_list = []
    for p in patients:
        patient_list.append({
            "pid": p.id,
            "age": p.age,
            "ward": p.ward,
            "risk": p.risk_score,
            "diagnosis": p.diagnosis or "Unspecified",
            "schemes": json.loads(p.scheme_eligible) if p.scheme_eligible else []
        })
    staff_metrics = []
    if requesting_user.role == "admin":
        docs = db.query(User).filter(User.role == "doctor").all()
        for d in docs:
            d_patients = [p for p in patients if p.assigned_doctor_id == d.id]
            staff_metrics.append({
                "doctor_name": d.name,
                "specialization": d.specialization,
                "patient_count": len(d_patients),
                "avg_risk": round(sum(p.risk_score for p in d_patients)/len(d_patients), 2) if d_patients else 0,
                "alerts_triggered": len(d.alerts)
            })
    total = len(patients)
    avg_risk = round(sum(p.risk_score for p in patients) / total, 3) if total > 0 else 0
    return {
        "summary": {
            "total_patients": total,
            "avg_hospital_risk": avg_risk,
        },
        "patients_table": patient_list,
        "staff_performance": staff_metrics
    }
def ask(db, question, requesting_user):
    ctx = build_context(db, requesting_user)
    ctx_text = json.dumps(ctx, indent=2)
    sys_prompt = (
        "You are the 'SecureHealth AI Intelligence Agent'. You are analyzing medical data.\n"
        f"**IMPORTANT CONTEXT**: You are speaking to a {requesting_user.role}. "
        "The data provided to you is ALREADY strictly filtered. It ONLY contains data "
        "they are authorized to see (e.g. only their own assigned patients and wards).\n\n"
        "**STRICT RULES FOR YOUR RESPONSE:**\n"
        "1. **Never reveal patient names** (use the provided PID).\n"
        "2. **Acknowledge Scope**: If they ask about 'the hospital' or 'other doctors', remind them "
        "that as a Doctor/Nurse, they are only viewing data for their assigned area.\n"
        "3. **Extremely Neat Formatting**: Your response MUST be highly readable. "
        "Use Markdown extensively (bold headers, bulleted lists, line breaks). Do not write walls of text.\n"
        "4. **Data-Driven**: If someone asks for specific risk (e.g., 'patient 55'), check 'patients_table'. "
        "If a data point isn't in the provided context, state clearly 'I do not have access to that data in your current scope.'\n"
        "5. **Admin Access**: (If provided) Use 'staff_performance' to compare doctors or identify high-workload areas."
    )
    reply = ask_gemini(sys_prompt, ctx_text, question)
    db.add(AgentCommand(
        issued_by=requesting_user.id,
        agent="privacy_query",
        command_text=question,
        result_summary=reply[:300] + "..." if len(reply) > 300 else reply,
    ))
    db.commit()
    return {
        "answer": reply,
        "timestamp": datetime.utcnow().isoformat(),
        "meta": {
            "records_analyzed": len(ctx["patients_table"]),
            "role": requesting_user.role
        }
    }
