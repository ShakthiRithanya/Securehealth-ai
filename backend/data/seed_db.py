import sys
import os
import json
import random
from collections import defaultdict
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
db = SessionLocal()
for tbl in reversed(Base.metadata.sorted_tables):
    db.execute(tbl.delete())
db.commit()
DEPARTMENTS = ["OB-GYN", "ICU", "General", "Pediatrics", "Surgery",
               "Cardiology", "Neurology", "Oncology", "Orthopedics", "Emergency"]
WARDS = ["Ward A", "Ward B", "Ward C", "Ward D", "Maternity Ward",
         "ICU", "Pediatric Ward", "Surgical Ward"]
FIRST_NAMES = [
    "Anita", "Priya", "Meena", "Sunita", "Kavita", "Rekha", "Suman", "Lata", "Pooja", "Aarti",
    "Seema", "Geeta", "Ritu", "Mamta", "Shobha", "Vandana", "Usha", "Nita", "Sarla", "Kamla",
    "Pushpa", "Gita", "Mala", "Durga", "Savita", "Hemlata", "Bindu", "Champa", "Nalini", "Radha",
    "Deepa", "Kiran", "Madhu", "Neelam", "Preeti", "Rani", "Shanti", "Vidya", "Yasmin", "Zoya",
    "Anjali", "Bhavna", "Chitra", "Divya", "Esha", "Farah", "Gauri", "Hema", "Indu", "Jaya",
    "Kajal", "Laxmi", "Maya", "Nidhi", "Omana", "Payal", "Rupa", "Sneha", "Tanya", "Uma"
]
LAST_NAMES = [
    "Sharma", "Singh", "Patel", "Devi", "Rao", "Nair", "Gupta", "Mishra", "Joshi", "Tiwari",
    "Verma", "Chauhan", "Agrawal", "Soni", "Pillai", "Iyer", "Mehta", "Bose", "Yadav", "Dubey",
    "Reddy", "Saxena", "Thakur", "Jain", "Patil", "Shukla", "Kapoor", "Roy", "Das", "Pandey",
    "Kulkarni", "Deshmukh", "Choudhury", "Srivastava", "Malhotra", "Khanna", "Bhardwaj", "Kumar", "Gill"
]
def generate_unique_names(count):
    names = set()
    while len(names) < count:
        name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
        names.add(name)
    return list(names)
DOCTOR_DATA = [
    {"name": "Dr. Arun Mehta", "spec": "Obstetrician", "dept": "OB-GYN"},
    {"name": "Dr. Sunita Rao", "spec": "Intensivist", "dept": "ICU"},
    {"name": "Dr. Vikram Patel", "spec": "General Physician", "dept": "General"},
    {"name": "Dr. Priya Nair", "spec": "Pediatrician", "dept": "Pediatrics"},
    {"name": "Dr. Rajesh Gupta", "spec": "General Surgeon", "dept": "Surgery"},
    {"name": "Dr. Ananya Sharma", "spec": "Cardiologist", "dept": "Cardiology"},
    {"name": "Dr. Suresh Joshi", "spec": "Neurologist", "dept": "Neurology"},
    {"name": "Dr. Kavya Iyer", "spec": "Oncologist", "dept": "Oncology"},
    {"name": "Dr. Manish Singh", "spec": "Orthopedic Surgeon", "dept": "Orthopedics"},
    {"name": "Dr. Deepa Verma", "spec": "Emergency Physician", "dept": "Emergency"},
]
NURSE_NAMES = [
    f"Nurse {n}" for n in [
        "Rekha", "Meena", "Sonal", "Anita", "Pooja",
        "Geeta", "Lata", "Uma", "Sita", "Rita",
        "Kamla", "Sarla", "Vimla", "Pushpa", "Neha"
    ]
]
MEDICAL_DATA_MAP = {
    "Obstetrician": {
        "diagnoses": ["Normal Pregnancy", "Gestational Diabetes", "Preeclampsia", "Twin Pregnancy"],
        "medicines": ["Folic Acid", "Iron Supplements", "Calcium", "Labetalol"],
        "treatments": ["Ultrasound scan", "Blood pressure monitoring", "Glucose tolerance test"],
    },
    "Intensivist": {
        "diagnoses": ["Septic Shock", "Acute Respiratory Distress", "Multi-organ Failure", "Severe Pneumonia"],
        "medicines": ["Norepinephrine", "Meropenem", "Propofol", "Heparin"],
        "treatments": ["Mechanical ventilation", "Central line insertion", "Arterial line monitoring", "Chest X-ray"],
    },
    "General Physician": {
        "diagnoses": ["Type 2 Diabetes", "Hypertension", "Dengue Fever", "Viral Fever"],
        "medicines": ["Metformin", "Amlodipine", "Paracetamol", "Azithromycin"],
        "treatments": ["CBC Test", "Lipid profile", "Urine analysis"],
    },
    "Pediatrician": {
        "diagnoses": ["Childhood Asthma", "Gastroenteritis", "Chickenpox", "Neonatal Jaundice"],
        "medicines": ["Salbutamol syrup", "ORS", "Calpol drops", "Zinc supplements"],
        "treatments": ["Nebulization", "Dehydration assessment", "Vaccination update"],
    },
    "General Surgeon": {
        "diagnoses": ["Acute Appendicitis", "Inguinal Hernia", "Gallstones", "Renal Calculi"],
        "medicines": ["Ceftriaxone", "Tramadol", "Pan-D", "Metronidazole"],
        "treatments": ["Laparoscopic surgery", "Abdominal Ultrasound", "Wound dressing", "IV Fluids"],
    },
    "Cardiologist": {
        "diagnoses": ["Coronary Artery Disease", "Heart Failure", "Atrial Fibrillation", "Myocardial Infarction"],
        "medicines": ["Atorvastatin", "Aspirin", "Clopidogrel", "Ramipril"],
        "treatments": ["ECG", "Echocardiogram", "Treadmill test", "Coronary Angiography"],
    },
    "Neurologist": {
        "diagnoses": ["Ischemic Stroke", "Epilepsy", "Migraine", "Multiple Sclerosis"],
        "medicines": ["Levetiracetam", "Sumatriptan", "Methylprednisolone", "Aspirin"],
        "treatments": ["MRI Brain", "CT Head", "EEG", "Lumbar puncture"],
    },
    "Oncologist": {
        "diagnoses": ["Breast Cancer", "Lung Carcinoma", "Leukemia", "Lymphoma"],
        "medicines": ["Tamoxifen", "Cisplatin", "Ondansetron", "Filgrastim"],
        "treatments": ["Chemotherapy session", "Biopsy", "PET-CT Scan", "Radiation planning"],
    },
    "Orthopedic Surgeon": {
        "diagnoses": ["Femur Fracture", "Osteoarthritis", "Lumbar Spondylosis", "Ligament Tear"],
        "medicines": ["Etoricoxib", "Glucosamine", "Calcium Carbonate", "Diclofenac gel"],
        "treatments": ["X-ray Joint", "Plaster application", "Physiotherapy", "Arthroscopy"],
    },
    "Emergency Physician": {
        "diagnoses": ["Polytrauma", "Acute Coronary Syndrome", "Poisoning", "Snake Bite"],
        "medicines": ["Adrenaline", "Atropine", "Anti-snake venom", "Activated charcoal"],
        "treatments": ["FAST Scan", "Intubation", "ECG monitoring", "Gastric lavage"],
    }
}
def eligible_schemes(age):
    matches = []
    local_state = "Maharashtra"
    for s in SCHEME_LIST:
        criteria = json.loads(s["eligibility_criteria"])
        min_a = criteria.get("min_age", 0)
        max_a = criteria.get("max_age", 999)
        if age < min_a or age > max_a:
            continue
        if s["state"] not in ("ALL", local_state):
            continue
        matches.append(s["scheme_name"])
    return list(set(matches))
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
for i, d in enumerate(DOCTOR_DATA):
    u = User(
        name=d["name"],
        email=f"doctor{i+1}@securehealth.in",
        password_hash=hash_password("Doctor@123"),
        role="doctor",
        department=d["dept"],
        specialization=d["spec"],
        is_locked=0,
    )
    db.add(u)
    doctors.append(u)
nurses = []
for i, name in enumerate(NURSE_NAMES):
    u = User(
        name=name,
        email=f"nurse{i+1}@securehealth.in",
        password_hash=hash_password("Nurse@123"),
        role="nurse",
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
patients = []
unique_names = generate_unique_names(200)
for i in range(200):
    age = random.randint(18, 48)
    ward = random.choice(WARDS)
    risk = round(random.uniform(0.05, 0.95), 3)
    p = Patient(
        name=unique_names[i],
        age=age,
        ward=ward,
        scheme_eligible=json.dumps(eligible_schemes(age)),
        risk_score=risk,
    )
    db.add(p)
    patients.append(p)
db.flush()
ward_p_map = defaultdict(list)
for p in patients:
    ward_p_map[p.ward].append(p)
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
doctor_wards_actual = defaultdict(list)
for idx, doc in enumerate(doctors):
    ward_keys = DOCTOR_WARD_MAP[idx]
    spec = doc.specialization
    med_meta = MEDICAL_DATA_MAP.get(spec, MEDICAL_DATA_MAP["General Physician"])
    for wk in ward_keys:
        wlist = ward_p_map[wk]
        offset = split_offset.get(wk, 0)
        if wk in SPLIT_WARDS:
            take = len(wlist) // 2 if offset == 0 else len(wlist) - (len(wlist) // 2)
        else:
            take = len(wlist)
        for p in wlist[offset : offset + take]:
            p.assigned_doctor_id = doc.id
            diagnosis = random.choice(med_meta["diagnoses"])
            p.diagnosis = diagnosis
            records = {
                "medications": random.sample(med_meta["medicines"], k=random.randint(1, 3)),
                "treatments": random.sample(med_meta["treatments"], k=random.randint(1, 2)),
                "vital_signs": {
                    "bp": f"{random.randint(110, 140)}/{random.randint(70, 90)}",
                    "temp": f"{random.uniform(97.5, 99.5):.1f}F",
                    "hr": f"{random.randint(65, 95)} bpm"
                },
                "last_assessment": "Patient is stable but requires continued monitoring of vitals."
            }
            p.medical_records = json.dumps(records)
        split_offset[wk] = offset + take
        doctor_wards_actual[doc.id].append(wk)
for i, n in enumerate(nurses):
    target_doc = doctors[i % len(doctors)]
    n.supervising_doctor_id = target_doc.id
    n.department = ",".join(doctor_wards_actual[target_doc.id])
db.flush()
all_users = admins + doctors + nurses
normal_raw = generate_normal_logs(all_users, patients, 500)
susp_raw = generate_suspicious_logs(all_users, patients, 80)
crit_raw = generate_critical_logs(all_users, patients, 40)
for row in normal_raw + susp_raw + crit_raw:
    lg = AccessLog(**row)
    db.add(lg)
db.commit()
db.close()
print("Realistic Medical Seed Complete: 200 patients with diagnoses, medications, and treatments.")
