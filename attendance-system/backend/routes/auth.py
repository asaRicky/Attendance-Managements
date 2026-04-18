from fastapi import APIRouter, HTTPException
from models.user import UserLogin
from core.security import verify_password, create_access_token
from database import db

router = APIRouter()

@router.post("/login")
async def login(user: UserLogin):
    db_user = await db["users"].find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.username, "role": db_user["role"]})
    return {"access_token": token, "token_type": "bearer"}
