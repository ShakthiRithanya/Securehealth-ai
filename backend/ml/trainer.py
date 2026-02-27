import sys
import os
import pickle

import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.database import SessionLocal
from backend.models import AccessLog, User
from backend.ml.feature_eng import extract_features, FEATURE_COLS
from backend.config import MODEL_PATH, SCALER_PATH

db = SessionLocal()

log_rows = db.query(AccessLog).all()
user_rows = db.query(User).all()
db.close()

logs_df = pd.DataFrame([{
    "id": r.id,
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
} for u in user_rows])

feat_df = extract_features(logs_df, users_df)

if feat_df.empty:
    print("No features extracted. Run seed_db first.")
    sys.exit(1)

X = feat_df[FEATURE_COLS].values
y = feat_df["flagged"].values

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

scaler = StandardScaler()
X_train_sc = scaler.fit_transform(X_train)
X_test_sc = scaler.transform(X_test)

clf = GradientBoostingClassifier(n_estimators=150, max_depth=4, learning_rate=0.08, random_state=42)
clf.fit(X_train_sc, y_train)

preds = clf.predict(X_test_sc)
print(f"Accuracy: {accuracy_score(y_test, preds):.4f}")
print(classification_report(y_test, preds, target_names=["normal", "anomaly"]))

models_dir = os.path.dirname(MODEL_PATH)
os.makedirs(models_dir, exist_ok=True)

with open(MODEL_PATH, "wb") as f:
    pickle.dump(clf, f)

with open(SCALER_PATH, "wb") as f:
    pickle.dump(scaler, f)

print(f"Model saved  → {MODEL_PATH}")
print(f"Scaler saved → {SCALER_PATH}")
