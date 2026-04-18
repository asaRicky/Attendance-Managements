# routes/auth.py
from fastapi import APIRouter, HTTPException, Depends
from models.user import UserLogin
from core.security import verify_password, create_access_token, get_current_user
from database import db

router = APIRouter()


@router.post("/login")
async def login(user: UserLogin):
    db_user = await db["users"].find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.username, "role": db_user["role"]})

    return {
        "access_token": token,
        "token_type": "bearer",
        # ✅ Return user info directly so the frontend doesn't need a second request
        "user": {
            "username":  db_user["username"],
            "full_name": db_user.get("full_name", ""),
            "role":      db_user["role"],
            "email":     db_user.get("email", ""),
            "school":    db_user.get("school", ""),
        },
    }


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    """Return the profile of the currently logged-in user."""
    return {
        "username":  current_user["username"],
        "full_name": current_user.get("full_name", ""),
        "role":      current_user["role"],
        "email":     current_user.get("email", ""),
        "school":    current_user.get("school", ""),
    }