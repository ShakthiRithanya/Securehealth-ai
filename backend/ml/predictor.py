import os
import pickle

import pandas as pd

from backend.ml.feature_eng import extract_features, FEATURE_COLS
from backend.config import MODEL_PATH, SCALER_PATH

_clf = None
_scaler = None


def _load():
    global _clf, _scaler
    if _clf is None:
        if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
            return False
        with open(MODEL_PATH, "rb") as f:
            _clf = pickle.load(f)
        with open(SCALER_PATH, "rb") as f:
            _scaler = pickle.load(f)
    return True


def score_users(logs_df: pd.DataFrame, users_df: pd.DataFrame):
    if not _load():
        return []

    feat_df = extract_features(logs_df, users_df)
    if feat_df.empty:
        return []

    X = feat_df[FEATURE_COLS].values
    X_sc = _scaler.transform(X)
    probs = _clf.predict_proba(X_sc)[:, 1]

    results = []
    for i, row in feat_df.iterrows():
        entry = {"user_id": int(row["user_id"]), "anomaly_score": round(float(probs[i]), 4)}
        for col in FEATURE_COLS:
            entry[col] = row[col]
        results.append(entry)

    results.sort(key=lambda x: x["anomaly_score"], reverse=True)
    return results
