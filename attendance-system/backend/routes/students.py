from fastapi import APIRouter
from models.student import StudentCreate, StudentUpdate
from database import db
from bson import ObjectId

router = APIRouter()

def fix_id(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@router.get("/")
async def get_students():
    students = await db["students"].find().to_list(500)
    return [fix_id(s) for s in students]

@router.post("/")
async def create_student(student: StudentCreate):
    data = student.dict()
    # keep reg_number in sync with student_id
    if not data.get("reg_number"):
        data["reg_number"] = data["student_id"]
    result = await db["students"].insert_one(data)
    return {"id": str(result.inserted_id)}

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

@router.delete("/{student_id}")
async def delete_student(student_id: str):
    await db["students"].delete_one({"_id": ObjectId(student_id)})
    return {"message": "Deleted"}