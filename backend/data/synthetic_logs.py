import random
from datetime import datetime, timedelta

_NORMAL_ACTIONS = ["VIEW", "VIEW", "VIEW", "EDIT", "LOGIN", "LOGOUT"]
_NORMAL_RESOURCES = ["patient_record", "patient_record", "report", "lab_result"]
_SUSP_RESOURCES = ["patient_record", "scheme_data", "report"]
_CRIT_RESOURCES = ["patient_record", "scheme_data", "report", "lab_result"]


def _past_dt(days_back_max=30):
    return datetime.utcnow() - timedelta(days=random.randint(0, days_back_max))


def _daytime(dt):
    return dt.replace(
        hour=random.randint(8, 19),
        minute=random.randint(0, 59),
        second=random.randint(0, 59),
        microsecond=0,
    )


def _offhours(dt):
    hour = random.choice([0, 1, 2, 3, 4, 5, 22, 23])
    return dt.replace(hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59), microsecond=0)


def _internal_ip():
    return f"10.0.{random.randint(1, 5)}.{random.randint(10, 200)}"


def _external_ip():
    return f"{random.randint(1, 254)}.{random.randint(0, 254)}.{random.randint(0, 254)}.{random.randint(1, 254)}"


def generate_normal_logs(users, patients, n):
    staff = [u for u in users if u.role in ("doctor", "nurse")]
    logs = []
    for _ in range(n):
        user = random.choice(staff)
        action = random.choice(_NORMAL_ACTIONS)
        patient_id = random.choice(patients).id if action not in ("LOGIN", "LOGOUT") else None
        logs.append({
            "user_id": user.id,
            "patient_id": patient_id,
            "action": action,
            "resource": random.choice(_NORMAL_RESOURCES),
            "ip_address": _internal_ip(),
            "timestamp": _daytime(_past_dt()),
            "flagged": 0,
        })
    return logs


def generate_suspicious_logs(users, patients, n):
    staff = [u for u in users if u.role in ("doctor", "nurse")]
    logs = []
    while len(logs) < n:
        user = random.choice(staff)
        burst_count = random.randint(6, 12)
        burst_patients = random.sample(patients, min(burst_count, len(patients)))
        base = _offhours(_past_dt())
        ip = _internal_ip()
        for p in burst_patients:
            if len(logs) >= n:
                break
            ts = base + timedelta(minutes=random.randint(0, 4), seconds=random.randint(0, 59))
            action = random.choices(["VIEW", "EXPORT", "EDIT"], weights=[50, 30, 20])[0]
            logs.append({
                "user_id": user.id,
                "patient_id": p.id,
                "action": action,
                "resource": random.choice(_SUSP_RESOURCES),
                "ip_address": ip,
                "timestamp": ts,
                "flagged": 1,
            })
    return logs[:n]


def generate_critical_logs(users, patients, n):
    all_staff = [u for u in users if u.role in ("doctor", "nurse", "admin")]
    logs = []
    for _ in range(n):
        user = random.choice(all_staff)
        patient = random.choice(patients)
        dt = _past_dt()
        dt = dt.replace(
            hour=random.choice([1, 2, 3, 4]),
            minute=random.randint(0, 59),
            second=random.randint(0, 59),
            microsecond=0,
        )
        logs.append({
            "user_id": user.id,
            "patient_id": patient.id,
            "action": "EXPORT",
            "resource": random.choice(_CRIT_RESOURCES),
            "ip_address": _external_ip(),
            "timestamp": dt,
            "flagged": 1,
        })
    return logs
