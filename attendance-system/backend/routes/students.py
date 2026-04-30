from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.student import StudentCreate, StudentUpdate, StudentSelfRegister
from database import db
from bson import ObjectId
import secrets
import jwt
import os

router = APIRouter()
bearer = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY", "changeme")

# ── Auth helper ───────────────────────────────────────────────
def get_current_lecturer(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> str:
    """Decode the JWT and return the lecturer's user _id as a string."""
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub") or payload.get("id") or payload.get("user_id")
        if not user_id:
            raise HTTPException(401, "Invalid token payload")
        return str(user_id)
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


def fix_id(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


# ── Get all approved students (lecturer-scoped) ───────────────
@router.get("/")
async def get_students(lecturer_id: str = Depends(get_current_lecturer)):
    students = await db["students"].find(
        {"status": {"$ne": "pending"}, "lecturer_id": lecturer_id}
    ).to_list(500)
    return [fix_id(s) for s in students]


# ── Get pending students (lecturer-scoped) ────────────────────
@router.get("/pending")
async def get_pending(lecturer_id: str = Depends(get_current_lecturer)):
    students = await db["students"].find(
        {"status": "pending", "lecturer_id": lecturer_id}
    ).to_list(200)
    return [fix_id(s) for s in students]


# ── Create student (by lecturer) ──────────────────────────────
@router.post("/")
async def create_student(
    student: StudentCreate,
    lecturer_id: str = Depends(get_current_lecturer),
):
    data = student.dict()
    if not data.get("reg_number"):
        data["reg_number"] = data["student_id"]
    data["status"] = "approved"
    data["lecturer_id"] = lecturer_id          # ← tie to this lecturer
    result = await db["students"].insert_one(data)
    return {"id": str(result.inserted_id)}


# ── Self-register (by student via QR) ────────────────────────
@router.post("/self-register")
async def self_register(data: StudentSelfRegister):
    # Validate that the token exists and belongs to a real lecturer
    token_doc = await db["register_tokens"].find_one({"token": data.token})
    if not token_doc:
        raise HTTPException(400, "Invalid or expired registration link.")

    lecturer_id = token_doc.get("lecturer_id")
    if not lecturer_id:
        raise HTTPException(400, "Registration link has no lecturer associated.")

    # Check for duplicate student_id scoped to this lecturer
    existing = await db["students"].find_one({
        "student_id": data.student_id,
        "lecturer_id": lecturer_id,
    })
    if existing:
        raise HTTPException(400, "A student with that ID is already registered for this class.")

    payload = data.dict()
    payload["reg_number"]  = data.student_id
    payload["status"]      = "pending"
    payload["lecturer_id"] = lecturer_id       # ← inherit from token
    result = await db["students"].insert_one(payload)
    return {
        "message": "Registration submitted. Your lecturer will approve it shortly.",
        "id": str(result.inserted_id),
    }


# ── Generate self-register token/link ────────────────────────
@router.post("/generate-link")
async def generate_link(
    body: dict,
    lecturer_id: str = Depends(get_current_lecturer),
):
    token  = secrets.token_urlsafe(16)
    school = body.get("school", "")
    dept   = body.get("department", "")
    await db["register_tokens"].insert_one({
        "token":       token,
        "school":      school,
        "department":  dept,
        "lecturer_id": lecturer_id,             # ← store who generated it
    })
    return {"token": token, "school": school, "department": dept}


# ── Approve a pending student ─────────────────────────────────
@router.patch("/{student_id}/approve")
async def approve_student(
    student_id: str,
    lecturer_id: str = Depends(get_current_lecturer),
):
    result = await db["students"].update_one(
        {"_id": ObjectId(student_id), "lecturer_id": lecturer_id},
        {"$set": {"status": "approved"}}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Student not found or not yours")
    return {"message": "Approved"}


# ── Reject (delete) a pending student ────────────────────────
@router.delete("/{student_id}/reject")
async def reject_student(
    student_id: str,
    lecturer_id: str = Depends(get_current_lecturer),
):
    result = await db["students"].delete_one(
        {"_id": ObjectId(student_id), "lecturer_id": lecturer_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(404, "Student not found or not yours")
    return {"message": "Rejected"}


# ── Update student ────────────────────────────────────────────
@router.put("/{student_id}")
async def update_student(
    student_id: str,
    data: StudentUpdate,
    lecturer_id: str = Depends(get_current_lecturer),
):
    update = {k: v for k, v in data.dict().items() if v is not None}
    if "student_id" in update and not update.get("reg_number"):
        update["reg_number"] = update["student_id"]
    result = await db["students"].update_one(
        {"_id": ObjectId(student_id), "lecturer_id": lecturer_id},
        {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Student not found or not yours")
    return {"message": "Updated"}


# ── Delete student ────────────────────────────────────────────
@router.delete("/{student_id}")
async def delete_student(
    student_id: str,
    lecturer_id: str = Depends(get_current_lecturer),
):
    result = await db["students"].delete_one(
        {"_id": ObjectId(student_id), "lecturer_id": lecturer_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(404, "Student not found or not yours")
    return {"message": "Deleted"}