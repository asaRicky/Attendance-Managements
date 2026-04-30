from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError, OperationFailure
from dotenv import load_dotenv
import os

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client["attendance_db"]


async def create_indexes():
    for col_name in ["users", "students", "classes", "attendance", "register_tokens"]:
        try:
            await db[col_name].drop_indexes()
        except Exception:
            pass

    await db["users"].create_index("username", unique=True)

    # email unique — partialFilterExpression only indexes documents where
    # email exists AND is not an empty string, so multiple users with no
    # email ("" or missing) never conflict with each other.
    # NOTE: do NOT combine with sparse=True — MongoDB rejects that combination.
    
async def create_indexes():
    try:
        await db["users"].create_index("email", unique=True)
    except (DuplicateKeyError, OperationFailure) as e:
        print(f"Warning: Could not create unique index on email — {e}")
        print("Clean up duplicate emails in the users collection first.")

    await db["users"].create_index("verification_token", sparse=True)
    await db["users"].create_index("reset_token",        sparse=True)

    await db["students"].create_index([("lecturer_id", 1), ("status", 1)])
    await db["students"].create_index([("lecturer_id", 1), ("reg_number", 1)])

    await db["register_tokens"].create_index("token",       unique=True)
    await db["register_tokens"].create_index("lecturer_id")

    await db["attendance"].create_index([("student_id", 1), ("date", 1)])
    await db["attendance"].create_index("unit_id")

    await db["classes"].create_index("unit_code")