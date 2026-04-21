from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client["attendance_db"]

async def create_indexes():
    # Drop ALL existing indexes first to avoid conflicts from old unique indexes
    for col_name in ["users", "students", "classes", "attendance"]:
        try:
            await db[col_name].drop_indexes()
        except Exception:
            pass

    # Recreate clean — none are unique, duplicate checking handled in code
    await db["students"].create_index("reg_number")
    await db["attendance"].create_index([("student_id", 1), ("date", 1)])
    await db["attendance"].create_index("unit_id")
    await db["classes"].create_index("unit_code")