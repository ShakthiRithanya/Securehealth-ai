import os

JWT_SECRET = os.getenv("JWT_SECRET", "sh_jwt_s3cr3t_2024")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRY_HOURS = 12

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

DB_PATH = os.getenv("DB_PATH", "securehealth.db")
DB_URL = f"sqlite:///{DB_PATH}"

ANOMALY_MEDIUM = 0.4
ANOMALY_HIGH = 0.7
ANOMALY_CRITICAL = 0.9

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml_models", "threat_model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "..", "ml_models", "scaler.pkl")
 
