from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client["attendance_db"]

async def create_indexes():
    await db["students"].create_index("reg_number", unique=True)
    await db["attendance"].create_index([("student_id", 1), ("date", 1)])
    await db["attendance"].create_index("unit_id")
    await db["users"].create_index("username", unique=True)
    await db["classes"].create_index("unit_code", unique=True)
