from fastapi import APIRouter, HTTPException
from models.student import StudentCreate, StudentUpdate, StudentSelfRegister
from database import db
from bson import ObjectId
import secrets

router = APIRouter()

def fix_id(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


# ── Get all approved students ─────────────────────────────────
@router.get("/")
async def get_students():
    students = await db["students"].find({"status": {"$ne": "pending"}}).to_list(500)
    return [fix_id(s) for s in students]


# ── Get pending students ──────────────────────────────────────
@router.get("/pending")
async def get_pending():
    students = await db["students"].find({"status": "pending"}).to_list(200)
    return [fix_id(s) for s in students]


# ── Create student (by lecturer) ──────────────────────────────
@router.post("/")
async def create_student(student: StudentCreate):
    data = student.dict()
    if not data.get("reg_number"):
        data["reg_number"] = data["student_id"]
    data["status"] = "approved"
    result = await db["students"].insert_one(data)
    return {"id": str(result.inserted_id)}


# ── Self-register (by student via QR) ────────────────────────
@router.post("/self-register")
async def self_register(data: StudentSelfRegister):
    # check for duplicate student_id
    existing = await db["students"].find_one({"student_id": data.student_id})
    if existing:
        raise HTTPException(400, "A student with that ID already exists.")

    payload = data.dict()
    payload["reg_number"] = data.student_id
    payload["status"]     = "pending"
    result = await db["students"].insert_one(payload)
    return {"message": "Registration submitted. Your lecturer will approve it shortly.", "id": str(result.inserted_id)}


# ── Generate self-register token/link ────────────────────────
@router.post("/generate-link")
async def generate_link(body: dict):
    token  = secrets.token_urlsafe(16)
    school = body.get("school", "")
    dept   = body.get("department", "")
    # store token so we can optionally validate it later
    await db["register_tokens"].insert_one({"token": token, "school": school, "department": dept})
    return {"token": token, "school": school, "department": dept}


# ── Approve a pending student ─────────────────────────────────
@router.patch("/{student_id}/approve")
async def approve_student(student_id: str):
    await db["students"].update_one(
        {"_id": ObjectId(student_id)},
        {"$set": {"status": "approved"}}
    )
    return {"message": "Approved"}


# ── Reject (delete) a pending student ────────────────────────
@router.delete("/{student_id}/reject")
async def reject_student(student_id: str):
    await db["students"].delete_one({"_id": ObjectId(student_id)})
    return {"message": "Rejected"}


# ── Update student ────────────────────────────────────────────
@router.put("/{student_id}")
async def update_student(student_id: str, data: StudentUpdate):
    update = {k: v for k, v in data.dict().items() if v is not None}
    if "student_id" in update and not update.get("reg_number"):
        update["reg_number"] = update["student_id"]
    await db["students"].update_one(
        {"_id": ObjectId(student_id)},
        {"$set": update}
    )
    return {"message": "Updated"}


# ── Delete student ────────────────────────────────────────────
@router.delete("/{student_id}")
async def delete_student(student_id: str):
    await db["students"].delete_one({"_id": ObjectId(student_id)})
    return {"message": "Deleted"}