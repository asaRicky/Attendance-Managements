# backend/routers/classes.py
from fastapi import APIRouter, HTTPException, status, Depends
from database import db
from bson import ObjectId
from typing import Optional
from pydantic import BaseModel
from core.security import get_current_user

router = APIRouter()


def fix_id(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def require_auth(user=Depends(get_current_user)):
    if user["role"] not in ("admin", "lecturer"):
        raise HTTPException(status_code=403, detail="Not authorised")
    return user


# ── Schemas ──────────────────────────────────────────────────

class ClassCreate(BaseModel):
    lesson_name:  str                   # e.g. "Data Structures & Algorithms"
    unit_code:    str                   # e.g. "ICS3101"
    school:       str                   # free text — any university name
    department:   str                   # free text — any department name
    schedule:     Optional[str] = None  # e.g. "Mon/Wed 8:00AM–10:00AM"
    venue:        Optional[str] = None
    credit_hours: Optional[int] = None


class ClassUpdate(BaseModel):
    lesson_name:  Optional[str] = None
    unit_code:    Optional[str] = None
    school:       Optional[str] = None
    department:   Optional[str] = None
    schedule:     Optional[str] = None
    venue:        Optional[str] = None
    credit_hours: Optional[int] = None


# ── GET /classes/ ─────────────────────────────────────────────
@router.get("/")
async def get_classes(user: dict = Depends(require_auth)):
    # Lecturers only see their own classes
    query = {} if user["role"] == "admin" else {"lecturer": user["username"]}
    classes = await db["classes"].find(query).to_list(500)
    return [fix_id(c) for c in classes]


# ── GET /classes/{id} ────────────────────────────────────────
@router.get("/{class_id}")
async def get_class(class_id: str, user: dict = Depends(require_auth)):
    doc = await _find_class(class_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Class not found")
    if user["role"] == "lecturer" and doc.get("lecturer") != user["username"]:
        raise HTTPException(status_code=403, detail="Not your class")
    return fix_id(doc)


# ── POST /classes/ ────────────────────────────────────────────
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_class(payload: ClassCreate, user: dict = Depends(require_auth)):
    # Prevent duplicate unit_code per lecturer
    existing = await db["classes"].find_one({
        "unit_code": payload.unit_code,
        "lecturer":  user["username"],
    })
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"You already have a class with unit code '{payload.unit_code}'"
        )

    doc = payload.dict()
    doc["lecturer"] = user["username"]   # always stamped from the token
    result = await db["classes"].insert_one(doc)
    created = await db["classes"].find_one({"_id": result.inserted_id})
    return fix_id(created)


# ── PATCH /classes/{id} ───────────────────────────────────────
@router.patch("/{class_id}")
async def update_class(
    class_id: str,
    payload: ClassUpdate,
    user: dict = Depends(require_auth),
):
    doc = await _find_class(class_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Class not found")
    if user["role"] == "lecturer" and doc.get("lecturer") != user["username"]:
        raise HTTPException(status_code=403, detail="Not your class")

    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")

    await db["classes"].update_one({"_id": doc["_id"]}, {"$set": updates})
    updated = await db["classes"].find_one({"_id": doc["_id"]})
    return fix_id(updated)


# ── DELETE /classes/{id} ──────────────────────────────────────
@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(class_id: str, user: dict = Depends(require_auth)):
    doc = await _find_class(class_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Class not found")
    if user["role"] == "lecturer" and doc.get("lecturer") != user["username"]:
        raise HTTPException(status_code=403, detail="Not your class")

    cid = str(doc["_id"])
    linked = await db["attendance"].find_one({"class_id": cid})
    if linked:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a class that has attendance records"
        )

    await db["classes"].delete_one({"_id": doc["_id"]})


# ── helper ────────────────────────────────────────────────────
async def _find_class(class_id: str):
    if ObjectId.is_valid(class_id):
        doc = await db["classes"].find_one({"_id": ObjectId(class_id)})
        if doc:
            return doc
    return await db["classes"].find_one({"unit_code": class_id})