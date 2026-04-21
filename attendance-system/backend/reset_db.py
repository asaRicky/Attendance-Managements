"""
reset_db.py  —  Run this to wipe all AttendIQ collections and start fresh.
Usage:  python reset_db.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URL)
db = client["attendance_db"]

async def reset():
    collections = ["users", "students", "classes", "attendance", "departments", "schools"]
    for col in collections:
        result = await db[col].delete_many({})
        print(f"  Cleared '{col}': {result.deleted_count} documents removed")

    print("\n✓ Database wiped. AttendIQ is ready for fresh use.")
    print("  Visit http://localhost:5173 → Sign up to create your first account.\n")

asyncio.run(reset())