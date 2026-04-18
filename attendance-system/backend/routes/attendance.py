from fastapi import APIRouter
from models.attendance import AttendanceRecord, BulkAttendance
from database import db
from datetime import date

router = APIRouter()

@router.post("/mark")
async def mark_attendance(record: AttendanceRecord):
    await db["attendance"].insert_one(record.dict())
    return {"message": "Attendance marked"}

@router.post("/bulk")
async def bulk_attendance(bulk: BulkAttendance):
    docs = [r.dict() for r in bulk.records]
    await db["attendance"].insert_many(docs)
    return {"message": f"{len(docs)} records saved"}

@router.get("/student/{student_id}")
async def get_student_attendance(student_id: str):
    records = await db["attendance"].find({"student_id": student_id}).to_list(500)
    for r in records:
        r["_id"] = str(r["_id"])
    return records

@router.get("/class/{class_id}/date/{date_str}")
async def get_class_attendance(class_id: str, date_str: str):
    records = await db["attendance"].find({"class_id": class_id, "date": date_str}).to_list(200)
    for r in records:
        r["_id"] = str(r["_id"])
    return records
