from fastapi import APIRouter
from database import db

router = APIRouter()

@router.get("/summary/{student_id}")
async def student_summary(student_id: str):
    pipeline = [
        {"$match": {"student_id": student_id}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    result = await db["attendance"].aggregate(pipeline).to_list(10)
    return result

@router.get("/class/{class_id}")
async def class_report(class_id: str):
    pipeline = [
        {"$match": {"class_id": class_id}},
        {"$group": {"_id": "$student_id", "present": {"$sum": {"$cond": [{"$eq": ["$status", "present"]}, 1, 0]}}, "total": {"$sum": 1}}}
    ]
    return await db["attendance"].aggregate(pipeline).to_list(200)
