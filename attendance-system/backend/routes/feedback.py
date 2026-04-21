from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database import db
from core.email import send_feedback_to_admin

router = APIRouter()


class FeedbackRequest(BaseModel):
    username:  str
    category:  str   # "bug" | "feature" | "general" | "praise"
    message:   str
    rating:    Optional[int] = None   # 1-5 NPS score


@router.post("/")
async def submit_feedback(data: FeedbackRequest):
    if not data.message.strip():
        raise HTTPException(400, "Feedback message cannot be empty.")
    if len(data.message) > 2000:
        raise HTTPException(400, "Message too long (max 2000 chars).")

    user = await db["users"].find_one({"username": data.username})
    name  = user.get("full_name", data.username) if user else data.username
    email = user.get("email", "")     if user else ""

    # store in db for your own records
    await db["feedback"].insert_one({
        "username":   data.username,
        "full_name":  name,
        "email":      email,
        "category":   data.category,
        "message":    data.message.strip(),
        "rating":     data.rating,
        "created_at": datetime.utcnow(),
    })

    # email you immediately
    await send_feedback_to_admin(name, email, data.category, data.message.strip())

    return {"message": "Thank you for your feedback!"}