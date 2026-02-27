from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException
from backend.config import JWT_SECRET, JWT_ALGORITHM, TOKEN_EXPIRY_HOURS

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain):
    return pwd_ctx.hash(plain)


def verify_password(plain, hashed):
    return pwd_ctx.verify(plain, hashed)


def create_token(data: dict):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRY_HOURS)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="invalid token")
 
