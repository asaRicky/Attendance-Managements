# backend/seed.py
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from core.security import hash_password
from datetime import date, timedelta
import random

MONGO_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URL)
db = client["attendance_db"]

async def seed():
    for col in ["users", "students", "classes", "attendance"]:
        await db[col].delete_many({})

    # ── USERS ────────────────────────────────────
    print("Seeding users...")
    await db["users"].insert_many([
        {
            "username":  "admin",
            "password":  hash_password("admin123"),
            "role":      "admin",
            "full_name": "System Administrator",
            "email":     "admin@attendease.app",
        },
        # Demo lecturer — teaches at two universities
        {
            "username":  "dr.omondi",
            "password":  hash_password("lecturer123"),
            "role":      "lecturer",
            "full_name": "Dr. Victor Omondi",
            "email":     "vomondi@demo.com",
        },
        # Demo lecturer B
        {
            "username":  "prof.waweru",
            "password":  hash_password("lecturer123"),
            "role":      "lecturer",
            "full_name": "Prof. Lucy Waweru",
            "email":     "lwaweru@demo.com",
        },
    ])

    # ── CLASSES  (school + department = free text) ─
    print("Seeding classes...")
    classes_result = await db["classes"].insert_many([
        # dr.omondi @ Strathmore
        {
            "lesson_name":  "Data Structures & Algorithms",
            "unit_code":    "ICS3101",
            "school":       "Strathmore University",
            "department":   "ICS",
            "lecturer":     "dr.omondi",
            "schedule":     "Mon/Wed 8:00AM–10:00AM",
            "venue":        "Lab 2, Koitalel Block",
            "credit_hours": 3,
        },
        {
            "lesson_name":  "Operating Systems",
            "unit_code":    "ICS3102",
            "school":       "Strathmore University",
            "department":   "ICS",
            "lecturer":     "dr.omondi",
            "schedule":     "Tue/Thu 10:00AM–12:00PM",
            "venue":        "Room 105, Koitalel Block",
            "credit_hours": 3,
        },
        # dr.omondi @ second university
        {
            "lesson_name":  "Computer Networks",
            "unit_code":    "CS201",
            "school":       "University of Nairobi",
            "department":   "Computer Science",
            "lecturer":     "dr.omondi",
            "schedule":     "Fri 2:00PM–5:00PM",
            "venue":        "Room 4, IT Block",
            "credit_hours": 3,
        },
        # prof.waweru @ KCA
        {
            "lesson_name":  "Strategic Management",
            "unit_code":    "BBA3101",
            "school":       "KCA University",
            "department":   "Business Administration",
            "lecturer":     "prof.waweru",
            "schedule":     "Mon/Wed 2:00PM–4:00PM",
            "venue":        "Room 401, Business Block",
            "credit_hours": 3,
        },
        {
            "lesson_name":  "Principles of Marketing",
            "unit_code":    "BBA2101",
            "school":       "KCA University",
            "department":   "Business Administration",
            "lecturer":     "prof.waweru",
            "schedule":     "Tue/Thu 2:00PM–4:00PM",
            "venue":        "Room 402, Business Block",
            "credit_hours": 3,
        },
    ])
    class_ids = [str(cid) for cid in classes_result.inserted_ids]

    # ── STUDENTS  (enrolled per class) ───────────
    print("Seeding students...")
    students = [
        # ICS3101
        {"student_id": "104298", "full_name": "Brian Otieno",    "class_id": class_ids[0], "email": "104298@demo.edu", "phone": "0712001001", "gender": "Male"},
        {"student_id": "104299", "full_name": "Alice Wanjiku",   "class_id": class_ids[0], "email": "104299@demo.edu", "phone": "0712001002", "gender": "Female"},
        {"student_id": "104300", "full_name": "Kevin Mwangi",    "class_id": class_ids[0], "email": "104300@demo.edu", "phone": "0712001003", "gender": "Male"},
        {"student_id": "104301", "full_name": "Grace Achieng",   "class_id": class_ids[0], "email": "104301@demo.edu", "phone": "0712001004", "gender": "Female"},
        {"student_id": "104302", "full_name": "Dennis Kipchoge", "class_id": class_ids[0], "email": "104302@demo.edu", "phone": "0712001005", "gender": "Male"},
        # ICS3102 (same students, different class)
        {"student_id": "104298", "full_name": "Brian Otieno",    "class_id": class_ids[1], "email": "104298@demo.edu", "phone": "0712001001", "gender": "Male"},
        {"student_id": "104299", "full_name": "Alice Wanjiku",   "class_id": class_ids[1], "email": "104299@demo.edu", "phone": "0712001002", "gender": "Female"},
        {"student_id": "104303", "full_name": "Mary Njeri",      "class_id": class_ids[1], "email": "104303@demo.edu", "phone": "0712001006", "gender": "Female"},
        # CS201 — UoN
        {"student_id": "201001", "full_name": "James Kamau",     "class_id": class_ids[2], "email": "201001@demo.edu", "phone": "0712002001", "gender": "Male"},
        {"student_id": "201002", "full_name": "Sylvia Atieno",   "class_id": class_ids[2], "email": "201002@demo.edu", "phone": "0712002002", "gender": "Female"},
        # BBA3101 — KCA
        {"student_id": "301001", "full_name": "Sandra Njoki",    "class_id": class_ids[3], "email": "301001@demo.edu", "phone": "0712003001", "gender": "Female"},
        {"student_id": "301002", "full_name": "Michael Rotich",  "class_id": class_ids[3], "email": "301002@demo.edu", "phone": "0712003002", "gender": "Male"},
        {"student_id": "301003", "full_name": "Amina Hassan",    "class_id": class_ids[3], "email": "301003@demo.edu", "phone": "0712003003", "gender": "Female"},
        # BBA2101 — KCA
        {"student_id": "301001", "full_name": "Sandra Njoki",    "class_id": class_ids[4], "email": "301001@demo.edu", "phone": "0712003001", "gender": "Female"},
        {"student_id": "301004", "full_name": "Steve Mugo",      "class_id": class_ids[4], "email": "301004@demo.edu", "phone": "0712003004", "gender": "Male"},
    ]
    await db["students"].insert_many(students)

    # ── ATTENDANCE  (past 2 weeks) ────────────────
    print("Seeding attendance records...")
    statuses = ["present", "present", "present", "present", "absent", "late"]
    today = date.today()
    records = []

    for days_ago in range(14, 0, -1):
        record_date = today - timedelta(days=days_ago)
        if record_date.weekday() >= 5:
            continue
        for s in students:
            records.append({
                "student_id": s["student_id"],
                "class_id":   s["class_id"],
                "date":       str(record_date),
                "status":     random.choice(statuses),
                "marked_by":  "dr.omondi" if s["class_id"] in class_ids[:3] else "prof.waweru",
            })

    await db["attendance"].insert_many(records)

    print("\n" + "=" * 50)
    print("  AttendEase — Demo Seed Complete")
    print("=" * 50)
    print(f"  Users      : 3  (1 admin, 2 lecturers)")
    print(f"  Classes    : {len(class_ids)}  (across 3 institutions)")
    print(f"  Students   : {len(students)}  (enrolled per class)")
    print(f"  Attendance : {len(records)} records (2 weeks)")
    print("-" * 50)
    print("  admin        / admin123")
    print("  dr.omondi    / lecturer123")
    print("  prof.waweru  / lecturer123")
    print("=" * 50 + "\n")


asyncio.run(seed())