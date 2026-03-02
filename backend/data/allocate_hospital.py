import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from collections import defaultdict
from backend.database import SessionLocal, engine
from backend.models import User, Patient, Base
from sqlalchemy import text
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN supervising_doctor_id INTEGER REFERENCES users(id)"))
        conn.commit()
        print("Added supervising_doctor_id column")
    except Exception:
        conn.rollback()
        print("supervising_doctor_id column already exists")
db = SessionLocal()
doctors = db.query(User).filter(User.role == 'doctor').order_by(User.id).all()
nurses  = db.query(User).filter(User.role == 'nurse').order_by(User.id).all()
all_patients = db.query(Patient).order_by(Patient.ward, Patient.id).all()
ward_patients = defaultdict(list)
for p in all_patients:
    ward_patients[p.ward].append(p)
wards = sorted(ward_patients.keys())
print(f"\nWards: {wards}")
print(f"Doctors: {len(doctors)}, Nurses: {len(nurses)}, Total patients: {len(all_patients)}\n")
DOCTOR_WARD_MAP = {
    0: ["Ward A"],
    1: ["Ward B"],
    2: ["Ward C"],
    3: ["Ward C"],
    4: ["Ward D"],
    5: ["Ward D"],
    6: ["Maternity Ward"],
    7: ["Maternity Ward"],
    8: ["ICU"],
    9: ["ICU", "Pediatric Ward", "Surgical Ward"],
}
SPLIT_WARDS = {"Ward C", "Ward D", "Maternity Ward", "ICU"}
split_offset = {}
doctor_wards_actual = {}
print("=== DOCTOR PATIENT ALLOCATION ===")
for idx, doc in enumerate(doctors):
    ward_keys = DOCTOR_WARD_MAP[idx]
    patients_for_doc = []
    actual_wards = set()
    for wk in ward_keys:
        wlist = ward_patients[wk]
        total = len(wlist)
        offset = split_offset.get(wk, 0)
        if wk in SPLIT_WARDS:
            take = total // 2 if offset == 0 else total - (total // 2)
        else:
            take = total
        for p in wlist[offset: offset + take]:
            p.assigned_doctor_id = doc.id
            patients_for_doc.append(p)
        split_offset[wk] = offset + take
        actual_wards.add(wk)
    doctor_wards_actual[doc.id] = sorted(actual_wards)
    print(f"  {doc.name:25s} → {len(patients_for_doc):3d} patients | wards: {sorted(actual_wards)}")
print("\n=== NURSE ASSIGNMENT ===")
nurse_wards_map = {}
for n in nurses:
    nurse_wards_map[n.id] = set(w.strip() for w in (n.department or '').split(',') if w.strip())
doc_nurse_map = defaultdict(list)
assigned_nurses = set()
for doc in doctors:
    doc_ward_set = set(doctor_wards_actual[doc.id])
    candidates = [
        n for n in nurses
        if n.id not in assigned_nurses and nurse_wards_map[n.id] & doc_ward_set
    ]
    candidates.sort(key=lambda n: len(nurse_wards_map[n.id] & doc_ward_set), reverse=True)
    for n in candidates[:2]:
        doc_nurse_map[doc.id].append(n.id)
        assigned_nurses.add(n.id)
remaining = [n for n in nurses if n.id not in assigned_nurses]
for n in remaining:
    target = min(doctors, key=lambda d: len(doc_nurse_map[d.id]))
    doc_nurse_map[target.id].append(n.id)
nurse_by_id = {n.id: n for n in nurses}
for doc in doctors:
    doc_wards = doctor_wards_actual[doc.id]
    for nid in doc_nurse_map[doc.id]:
        nurse = nurse_by_id[nid]
        nurse.supervising_doctor_id = doc.id
        nurse.department = ','.join(doc_wards)
        print(f"  {nurse.name:25s} → Dr. {doc.name:20s} | wards: {doc_wards}")
db.commit()
db.close()
print("\n✅ Allocation complete!")
