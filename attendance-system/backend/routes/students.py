from fastapi import APIRouter
from models.student import StudentCreate, StudentUpdate
from database import db
from bson import ObjectId

router = APIRouter()

@router.get("/")
async def get_students():
    students = await db["students"].find().to_list(100)
    for s in students:
        s["_id"] = str(s["_id"])
    return students

@router.post("/")
async def create_student(student: StudentCreate):
    result = await db["students"].insert_one(student.dict())
    return {"id": str(result.inserted_id)}

@router.put("/{student_id}")
async def update_student(student_id: str, data: StudentUpdate):
    await db["students"].update_one({"_id": ObjectId(student_id)}, {"$set": data.dict(exclude_none=True)})
    return {"message": "Updated"}

@router.delete("/{student_id}")
async def delete_student(student_id: str):
    await db["students"].delete_one({"_id": ObjectId(student_id)})
    return {"message": "Deleted"}
