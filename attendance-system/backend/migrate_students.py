"""What it does:
  1. Finds every student that has no lecturer_id field.
  2. Prints them so you can decide what to do.
  3. If you set ASSIGN_TO_LECTURER_ID below, it stamps all of them
     with that lecturer's _id.  Otherwise it just reports.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client    = AsyncIOMotorClient(MONGO_URL)
db        = client["attendance_db"]

# ── Set this to your user _id if you want to claim the orphaned students ──
ASSIGN_TO_LECTURER_ID = ""   # e.g. "6650a1234abcd..."


async def main():
    orphans = await db["students"].find(
        {"lecturer_id": {"$exists": False}}
    ).to_list(1000)

    if not orphans:
        print("✅  No orphaned students found — nothing to do.")
        return

    print(f"Found {len(orphans)} student(s) with no lecturer_id:\n")
    for s in orphans:
        print(f"  {s.get('full_name','?'):30s}  id={s['_id']}  reg={s.get('reg_number','?')}")

    if not ASSIGN_TO_LECTURER_ID:
        print("\n⚠️   ASSIGN_TO_LECTURER_ID is empty — no changes made.")
        print("    Set it at the top of this script and re-run to claim them.")
        return

    result = await db["students"].update_many(
        {"lecturer_id": {"$exists": False}},
        {"$set": {"lecturer_id": ASSIGN_TO_LECTURER_ID}},
    )
    print(f"\n✅  Updated {result.modified_count} student(s) → lecturer_id = {ASSIGN_TO_LECTURER_ID}")

    # Also fix orphaned register_tokens
    tok_result = await db["register_tokens"].update_many(
        {"lecturer_id": {"$exists": False}},
        {"$set": {"lecturer_id": ASSIGN_TO_LECTURER_ID}},
    )
    print(f"✅  Updated {tok_result.modified_count} register_token(s)")


asyncio.run(main())