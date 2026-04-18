# backend/routers/attendance.py
from fastapi import APIRouter, HTTPException, Depends
from models.attendance import AttendanceRecord, BulkAttendance
from database import db
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


# ── Single mark ───────────────────────────────────────────────
@router.post("/mark")
async def mark_attendance(record: AttendanceRecord, user: dict = Depends(require_auth)):
    await db["attendance"].update_one(
        {"student_id": record.student_id, "class_id": record.class_id, "date": record.date},
        {"$set": {**record.dict(), "marked_by": user["username"]}},
        upsert=True,
    )
    return {"message": "Attendance marked"}


# ── Bulk mark (upsert) ────────────────────────────────────────
@router.post("/bulk")
async def bulk_attendance(bulk: BulkAttendance, user: dict = Depends(require_auth)):
    from pymongo import UpdateOne
    ops = [
        UpdateOne(
            {"student_id": r.student_id, "class_id": r.class_id, "date": r.date},
            {"$set": {**r.dict(), "marked_by": user["username"]}},
            upsert=True,
        )
        for r in bulk.records
    ]
    result = await db["attendance"].bulk_write(ops)
    saved = result.upserted_count + result.modified_count
    return {"message": f"{saved} records saved"}


# ── By class + date ───────────────────────────────────────────
@router.get("/class/{class_id}/date/{date_str}")
async def get_class_attendance(class_id: str, date_str: str, _: dict = Depends(require_auth)):
    records = await db["attendance"].find(
        {"class_id": class_id, "date": date_str}
    ).to_list(500)
    return [fix_id(r) for r in records]


# ── By class (all dates) ──────────────────────────────────────
@router.get("/class/{class_id}")
async def get_class_all(class_id: str, _: dict = Depends(require_auth)):
    records = await db["attendance"].find(
        {"class_id": class_id}
    ).sort("date", -1).to_list(2000)
    return [fix_id(r) for r in records]


# ── By student ────────────────────────────────────────────────
@router.get("/student/{student_id}")
async def get_student_attendance(student_id: str, _: dict = Depends(require_auth)):
    records = await db["attendance"].find(
        {"student_id": student_id}
    ).sort("date", -1).to_list(500)
    return [fix_id(r) for r in records]


# ── Summary for a class ───────────────────────────────────────
@router.get("/summary/class/{class_id}")
async def class_summary(class_id: str, _: dict = Depends(require_auth)):
    pipeline = [
        {"$match": {"class_id": class_id}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    rows = await db["attendance"].aggregate(pipeline).to_list(10)
    summary = {r["_id"]: r["count"] for r in rows}
    total = sum(summary.values())
    return {
        "total":   total,
        "present": summary.get("present", 0),
        "absent":  summary.get("absent",  0),
        "late":    summary.get("late",    0),
        "rate":    round(summary.get("present", 0) / total * 100, 1) if total else 0,
    }