from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional
import secrets
from datetime import datetime, timedelta

from database import db
from core.security import verify_password, create_access_token, hash_password, decode_access_token
from core.email import (
    send_verification_email,
    send_welcome_email,
    send_password_reset_email,
)
from pymongo.errors import DuplicateKeyError

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ── Auth dependency ───────────────────────────────────────────────────────────
async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(401, "Invalid or expired token")
    user = await db["users"].find_one({"username": payload.get("sub")})
    if not user:
        raise HTTPException(401, "User not found")
    return user


# ── Schemas ───────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username:  str
    password:  str
    full_name: str
    email:     Optional[str] = ""
    role:      Optional[str] = "lecturer"
    school:    Optional[str] = ""

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token:    str
    password: str


# ── Register ──────────────────────────────────────────────────────────────────
@router.post("/register")
async def register(data: RegisterRequest, bg: BackgroundTasks):
    existing = await db["users"].find_one({"username": data.username.strip()})
    if existing:
        raise HTTPException(400, "That username is already taken.")

    verification_token = secrets.token_urlsafe(32)

    try:
        await db["users"].insert_one({
            "username":           data.username.strip(),
            "password":           hash_password(data.password),
            "full_name":          data.full_name.strip(),
            "email":              (data.email or "").strip(),
            "role":               data.role or "lecturer",
            "school":             data.school or "",
            "email_verified":     False,
            "verification_token": verification_token,
            "token_expires_at":   datetime.utcnow() + timedelta(hours=24),
            "created_at":         datetime.utcnow(),
            "last_login":         None,
        })
    except DuplicateKeyError:
        raise HTTPException(400, "That username is already taken.")
    except Exception as e:
        raise HTTPException(500, f"Registration failed: {str(e)}")

    if data.email and data.email.strip():
        bg.add_task(send_verification_email, data.email.strip(), data.full_name.strip(), verification_token)

    return {"message": "Account created. Check your email to verify your account."}


# ── Verify email ──────────────────────────────────────────────────────────────
@router.get("/verify-email")
async def verify_email(token: str, bg: BackgroundTasks):
    user = await db["users"].find_one({"verification_token": token})

    if not user:
        raise HTTPException(400, "Invalid or expired verification link.")
    if user.get("email_verified"):
        return {"message": "Already verified. You can sign in."}
    if datetime.utcnow() > user.get("token_expires_at", datetime.utcnow()):
        raise HTTPException(400, "Verification link has expired. Request a new one.")

    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {
            "email_verified":     True,
            "verification_token": None,
            "token_expires_at":   None,
        }},
    )

    if user.get("email"):
        bg.add_task(send_welcome_email, user["email"], user["full_name"])

    return {"message": "Email verified! You can now sign in."}


# ── Resend verification ───────────────────────────────────────────────────────
@router.post("/resend-verification")
async def resend_verification(bg: BackgroundTasks, body: dict):
    username = body.get("username", "").strip()
    user = await db["users"].find_one({"username": username})

    if not user:
        return {"message": "If that account exists, a new verification email has been sent."}
    if user.get("email_verified"):
        return {"message": "Your email is already verified."}
    if not user.get("email"):
        raise HTTPException(400, "No email on file. Contact support.")

    new_token = secrets.token_urlsafe(32)
    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {
            "verification_token": new_token,
            "token_expires_at":   datetime.utcnow() + timedelta(hours=24),
        }},
    )
    bg.add_task(send_verification_email, user["email"], user["full_name"], new_token)
    return {"message": "Verification email resent."}


# ── Login ─────────────────────────────────────────────────────────────────────
@router.post("/login")
async def login(data: LoginRequest):
    user = await db["users"].find_one({"username": data.username})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(401, "Invalid username or password")

    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}},
    )

    token = create_access_token({"sub": user["username"], "role": user.get("role", "lecturer")})

    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": {
            "username":       user["username"],
            "full_name":      user.get("full_name", user["username"]),
            "role":           user.get("role", "lecturer"),
            "email":          user.get("email", ""),
            "school":         user.get("school", ""),
            "email_verified": user.get("email_verified", False),
        },
    }


# ── Forgot password ───────────────────────────────────────────────────────────
@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, bg: BackgroundTasks):
    user = await db["users"].find_one({"email": data.email.strip()})
    msg = {"message": "If that email is registered, a reset link has been sent."}
    if not user:
        return msg

    reset_token = secrets.token_urlsafe(32)
    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {
            "reset_token":   reset_token,
            "reset_expires": datetime.utcnow() + timedelta(hours=1),
        }},
    )
    bg.add_task(send_password_reset_email, user["email"], user["full_name"], reset_token)
    return msg


# ── Reset password ────────────────────────────────────────────────────────────
@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    user = await db["users"].find_one({"reset_token": data.token})
    if not user:
        raise HTTPException(400, "Invalid or expired reset link.")
    if datetime.utcnow() > user.get("reset_expires", datetime.utcnow()):
        raise HTTPException(400, "Reset link has expired. Request a new one.")
    if len(data.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")

    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {
            "password":      hash_password(data.password),
            "reset_token":   None,
            "reset_expires": None,
        }},
    )
    return {"message": "Password reset successfully. You can now sign in."}


# ── Update profile ────────────────────────────────────────────────────────────
@router.patch("/profile")
async def update_profile(data: dict, current_user=Depends(get_current_user)):
    update_fields = {}
    if data.get("full_name") is not None:
        update_fields["full_name"] = data["full_name"]
    if data.get("email") is not None:
        update_fields["email"] = data["email"]
    if data.get("school") is not None:
        update_fields["school"] = data["school"]

    if update_fields:
        await db["users"].update_one(
            {"username": current_user["username"]},
            {"$set": update_fields},
        )
    return {"message": "Profile updated"}


# ── Change password ───────────────────────────────────────────────────────────
@router.post("/change-password")
async def change_password(data: dict, current_user=Depends(get_current_user)):
    if not data.get("current_password") or not data.get("new_password"):
        raise HTTPException(400, "Both current_password and new_password are required.")
    if not verify_password(data["current_password"], current_user["password"]):
        raise HTTPException(400, "Current password is incorrect.")
    if len(data["new_password"]) < 6:
        raise HTTPException(400, "New password must be at least 6 characters.")

    await db["users"].update_one(
        {"username": current_user["username"]},
        {"$set": {"password": hash_password(data["new_password"])}},
    )
    return {"message": "Password changed"}


# ── Delete account ────────────────────────────────────────────────────────────
@router.delete("/account")
async def delete_account(current_user=Depends(get_current_user)):
    await db["users"].delete_one({"username": current_user["username"]})
    return {"message": "Account deleted"}


# ── Me ────────────────────────────────────────────────────────────────────────
@router.get("/me")
async def me(current_user=Depends(get_current_user)):
    return {
        "username":       current_user["username"],
        "full_name":      current_user.get("full_name", ""),
        "role":           current_user.get("role", "lecturer"),
        "email":          current_user.get("email", ""),
        "school":         current_user.get("school", ""),
        "email_verified": current_user.get("email_verified", False),
    }

