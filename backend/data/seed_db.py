import sys
import os
import json
import random

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.database import engine, SessionLocal, Base
from backend.models import User, Patient, AccessLog, SchemeMapping
from backend.auth import hash_password
from backend.data.maternal_schemes import SCHEME_LIST
from backend.data.synthetic_logs import (
    generate_normal_logs,
    generate_suspicious_logs,
    generate_critical_logs,
)

Base.metadata.create_all(bind=engine)

STATES = ["Maharashtra", "Gujarat", "Rajasthan", "Uttar Pradesh", "Bihar",
          "Madhya Pradesh", "Tamil Nadu", "Kerala", "Jharkhand", "Odisha"]

DEPARTMENTS = ["OB-GYN", "ICU", "General", "Pediatrics", "Surgery",
               "Cardiology", "Neurology", "Oncology", "Orthopedics", "Emergency"]

WARDS = ["Ward A", "Ward B", "Ward C", "Ward D", "Maternity Ward",
         "ICU", "Pediatric Ward", "Surgical Ward"]

PATIENT_NAMES = [
    "Anita Sharma", "Priya Singh", "Meena Patel", "Sunita Devi", "Kavita Rao",
    "Rekha Nair", "Suman Gupta", "Lata Mishra", "Pooja Joshi", "Aarti Tiwari",
    "Seema Verma", "Geeta Chauhan", "Ritu Agrawal", "Mamta Soni", "Shobha Pillai",
    "Vandana Iyer", "Usha Mehta", "Nita Bose", "Sarla Yadav", "Kamla Dubey",
    "Pushpa Reddy", "Gita Saxena", "Mala Thakur", "Durga Jain", "Savita Patil",
    "Hemlata Shukla", "Bindu Kapoor", "Champa Roy", "Nalini Das", "Radha Pandey",
]

DOCTOR_NAMES = [
    "Dr. Arun Mehta", "Dr. Sunita Rao", "Dr. Vikram Patel", "Dr. Priya Nair",
    "Dr. Rajesh Gupta", "Dr. Ananya Sharma", "Dr. Suresh Joshi", "Dr. Kavya Iyer",
    "Dr. Manish Singh", "Dr. Deepa Verma",
]

NURSE_NAMES = [
    "Nurse Rekha", "Nurse Meena", "Nurse Sonal", "Nurse Anita", "Nurse Pooja",
    "Nurse Geeta", "Nurse Lata", "Nurse Uma", "Nurse Sita", "Nurse Rita",
    "Nurse Kamla", "Nurse Sarla", "Nurse Vimla", "Nurse Pushpa", "Nurse Neha",
]


def eligible_schemes(age, state):
    matches = []
    for s in SCHEME_LIST:
        criteria = json.loads(s["eligibility_criteria"])
        min_a = criteria.get("min_age", 0)
        max_a = criteria.get("max_age", 999)
        if age < min_a or age > max_a:
            continue
        if s["state"] not in ("ALL", state):
            continue
        matches.append(s["scheme_name"])
    return list(set(matches))


db = SessionLocal()

admins = []
for i in range(3):
    u = User(
        name=f"Admin {i+1}",
        email=f"admin{i+1}@securehealth.in",
        password_hash=hash_password("Admin@123"),
        role="admin",
        department="Administration",
        is_locked=0,
    )
    db.add(u)
    admins.append(u)

doctors = []
for i, name in enumerate(DOCTOR_NAMES):
    dept = DEPARTMENTS[i % len(DEPARTMENTS)]
    u = User(
        name=name,
        email=f"doctor{i+1}@securehealth.in",
        password_hash=hash_password("Doctor@123"),
        role="doctor",
        department=dept,
        is_locked=0,
    )
    db.add(u)
    doctors.append(u)

nurses = []
for i, name in enumerate(NURSE_NAMES):
    ward = WARDS[i % len(WARDS)]
    u = User(
        name=name,
        email=f"nurse{i+1}@securehealth.in",
        password_hash=hash_password("Nurse@123"),
        role="nurse",
        department=ward,
        is_locked=0,
    )
    db.add(u)
    nurses.append(u)

db.flush()

for s in SCHEME_LIST:
    sm = SchemeMapping(
        scheme_name=s["scheme_name"],
        state=s["state"],
        eligibility_criteria=s["eligibility_criteria"],
        benefit_amount=s["benefit_amount"],
    )
    db.add(sm)

db.flush()

patients = []
name_pool = PATIENT_NAMES * 7
for i in range(200):
    age = random.randint(18, 48)
    state = random.choice(STATES)
    ward = random.choice(WARDS)
    doc = random.choice(doctors)
    schemes = eligible_schemes(age, state)
    risk = round(random.uniform(0.05, 0.95), 3)
    p = Patient(
        name=name_pool[i % len(name_pool)],
        age=age,
        ward=ward,
        assigned_doctor_id=doc.id,
        scheme_eligible=json.dumps(schemes),
        risk_score=risk,
        state=state,
    )
    db.add(p)
    patients.append(p)

db.flush()

all_users = admins + doctors + nurses

normal_raw = generate_normal_logs(all_users, patients, 4200)
susp_raw = generate_suspicious_logs(all_users, patients, 600)
crit_raw = generate_critical_logs(all_users, patients, 200)

for row in normal_raw + susp_raw + crit_raw:
    lg = AccessLog(**row)
    db.add(lg)

db.commit()
db.close()

print(f"Users inserted   : {len(admins)} admins, {len(doctors)} doctors, {len(nurses)} nurses")
print(f"Patients inserted: 200")
print(f"Schemes inserted : {len(SCHEME_LIST)}")
print(f"Logs inserted    : {len(normal_raw)} normal, {len(susp_raw)} suspicious, {len(crit_raw)} critical")
print("Seed complete.")
