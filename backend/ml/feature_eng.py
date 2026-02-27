import pandas as pd


FEATURE_COLS = [
    "access_count",
    "unique_patients",
    "patient_to_action_ratio",
    "off_hours_flag",
    "export_count",
    "ip_change_flag",
    "weekend_flag",
    "avg_actions_per_min",
    "role_mismatch_flag",
]


def extract_features(logs_df, users_df):
    if logs_df.empty:
        return pd.DataFrame()

    df = logs_df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["bucket"] = df["timestamp"].dt.floor("15min")

    role_map = users_df.set_index("id")["role"].to_dict()
    df["role"] = df["user_id"].map(role_map).fillna("unknown")

    rows = []
    for (uid, bucket), grp in df.groupby(["user_id", "bucket"]):
        role = grp["role"].iloc[0]
        ac = len(grp)
        up = grp["patient_id"].nunique()
        ptr = round(up / ac, 4) if ac > 0 else 0
        hr = bucket.hour
        off = 1 if hr < 7 or hr >= 21 else 0
        exports = int((grp["action"] == "EXPORT").sum())
        ips = grp["ip_address"].nunique()
        ip_chg = 1 if ips > 1 else 0
        wk = 1 if bucket.weekday() >= 5 else 0
        apm = round(ac / 15, 4)

        mismatch = 0
        if role == "nurse":
            if exports > 0 or (grp["resource"] == "scheme_data").any():
                mismatch = 1
        elif role == "doctor":
            if exports > 3:
                mismatch = 1

        flagged = 1 if grp["flagged"].max() == 1 else 0

        rows.append({
            "user_id": uid,
            "bucket": bucket,
            "access_count": ac,
            "unique_patients": up,
            "patient_to_action_ratio": ptr,
            "off_hours_flag": off,
            "export_count": exports,
            "ip_change_flag": ip_chg,
            "weekend_flag": wk,
            "avg_actions_per_min": apm,
            "role_mismatch_flag": mismatch,
            "flagged": flagged,
        })

    return pd.DataFrame(rows)
 
