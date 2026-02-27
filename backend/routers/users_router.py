from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from backend.database import get_db
from backend.models import User
from backend.auth import hash_password
from backend.deps import require_admin

router = APIRouter()


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str
    department: Optional[str] = None


class LockToggle(BaseModel):
    is_locked: int


def fmt(u: User):
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "department": u.department,
        "is_locked": u.is_locked,
        "created_at": u.created_at,
    }


@router.get("/")
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return [fmt(u) for u in db.query(User).all()]


@router.post("/")
def create_user(body: UserCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="email already registered")
    u = User(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
        department=body.department,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return fmt(u)


@router.patch("/{uid}/lock")
def toggle_lock(uid: int, body: LockToggle, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    u = db.query(User).filter(User.id == uid).first()
    if not u:
        raise HTTPException(status_code=404, detail="user not found")
    u.is_locked = body.is_locked
    db.commit()
    return {"id": u.id, "is_locked": u.is_locked}


@router.delete("/{uid}")
def delete_user(uid: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if uid == admin.id:
        raise HTTPException(status_code=400, detail="cannot delete yourself")
    u = db.query(User).filter(User.id == uid).first()
    if not u:
        raise HTTPException(status_code=404, detail="user not found")
    db.delete(u)
    db.commit()
    return {"deleted": uid}
