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
    # Clear existing data
    for col in ["users", "students", "classes", "attendance", "departments", "schools"]:
        await db[col].delete_many({})

    print("Seeding schools...")
    await db["schools"].insert_many([
        {"code": "SCES", "name": "Strathmore School of Computing and Engineering Sciences", "dean": "Dr. John Okafor"},
        {"code": "SBS",  "name": "Strathmore Business School", "dean": "Prof. Ruth Wainaina"},
        {"code": "SIMS", "name": "School of Informatics and Mathematics", "dean": "Dr. Peter Ndung'u"},
        {"code": "SLS",  "name": "Strathmore Law School", "dean": "Prof. Grace Mwangi"},
        {"code": "SHC",  "name": "School of Humanities and Social Sciences", "dean": "Dr. Angela Otieno"},
        {"code": "SIBS", "name": "Strathmore Institute of Biblical Studies", "dean": "Fr. Michael Kariuki"},
        {"code": "SENL", "name": "School of Environment and Natural Land Use", "dean": "Dr. David Kimani"},
        {"code": "SPH",  "name": "School of Public Health", "dean": "Dr. Esther Njoroge"},
    ])

    print("Seeding departments...")
    await db["departments"].insert_many([
        # SCES
        {"code": "CS",   "name": "Computer Science",               "school": "SCES"},
        {"code": "IT",   "name": "Information Technology",         "school": "SCES"},
        {"code": "EE",   "name": "Electrical & Electronic Eng.",   "school": "SCES"},
        {"code": "SE",   "name": "Software Engineering",           "school": "SCES"},
        # SBS
        {"code": "MBA",  "name": "Master of Business Administration", "school": "SBS"},
        {"code": "BBA",  "name": "Bachelor of Business Administration", "school": "SBS"},
        {"code": "ACC",  "name": "Accounting & Finance",           "school": "SBS"},
        # SIMS
        {"code": "MIS",  "name": "Management Information Systems", "school": "SIMS"},
        {"code": "MTH",  "name": "Mathematics",                    "school": "SIMS"},
        {"code": "ACT",  "name": "Actuarial Science",              "school": "SIMS"},
        # SLS
        {"code": "LLB",  "name": "Bachelor of Laws",               "school": "SLS"},
        {"code": "LLM",  "name": "Master of Laws",                 "school": "SLS"},
        # SHC
        {"code": "COM",  "name": "Communication",                  "school": "SHC"},
        {"code": "DEV",  "name": "Development Studies",            "school": "SHC"},
        # SPH
        {"code": "PH",   "name": "Public Health",                  "school": "SPH"},
    ])

    print("Seeding users (admin + lecturers)...")
    await db["users"].insert_many([
        {
            "username": "admin",
            "password": hash_password("admin123"),
            "role": "admin",
            "full_name": "System Administrator",
            "email": "admin@strathmore.edu",
            "school": None
        },
        # SCES Lecturers
        {
            "username": "dr.omondi",
            "password": hash_password("lecturer123"),
            "role": "lecturer",
            "full_name": "Dr. Victor Omondi",
            "email": "vomondi@strathmore.edu",
            "school": "SCES", "department": "CS"
        },
        {
            "username": "dr.waweru",
            "password": hash_password("lecturer123"),
            "role": "lecturer",
            "full_name": "Dr. Lucy Waweru",
            "email": "lwaweru@strathmore.edu",
            "school": "SCES", "department": "SE"
        },
        {
            "username": "mr.njoroge",
            "password": hash_password("lecturer123"),
            "role": "lecturer",
            "full_name": "Mr. Ian Njoroge",
            "email": "injoroge@strathmore.edu",
            "school": "SCES", "department": "IT"
        },
        # SIMS Lecturers
        {
            "username": "dr.kamau",
            "password": hash_password("lecturer123"),
            "role": "lecturer",
            "full_name": "Dr. Anne Kamau",
            "email": "akamau@strathmore.edu",
            "school": "SIMS", "department": "ACT"
        },
        {
            "username": "dr.ndung'u",
            "password": hash_password("lecturer123"),
            "role": "lecturer",
            "full_name": "Dr. Paul Ndung'u",
            "email": "pndungu@strathmore.edu",
            "school": "SIMS", "department": "MIS"
        },
        # SBS Lecturers
        {
            "username": "prof.mwangi",
            "password": hash_password("lecturer123"),
            "role": "lecturer",
            "full_name": "Prof. Susan Mwangi",
            "email": "smwangi@strathmore.edu",
            "school": "SBS", "department": "BBA"
        },
        # SLS Lecturers
        {
            "username": "dr.otieno",
            "password": hash_password("lecturer123"),
            "role": "lecturer",
            "full_name": "Dr. Felix Otieno",
            "email": "fotieno@strathmore.edu",
            "school": "SLS", "department": "LLB"
        },
    ])

    print("Seeding units...")
    units = await db["classes"].insert_many([
        # SCES — Computer Science Y3
        {
            "unit_code": "CS3101",
            "unit_name": "Data Structures & Algorithms",
            "school": "SCES", "department": "CS",
            "lecturer": "dr.omondi",
            "year": 3, "semester": 1,
            "schedule": "Mon/Wed 8:00AM–10:00AM",
            "venue": "Lab 2, Koitalel Block", "credit_hours": 3
        },
        {
            "unit_code": "CS3102",
            "unit_name": "Operating Systems",
            "school": "SCES", "department": "CS",
            "lecturer": "dr.omondi",
            "year": 3, "semester": 1,
            "schedule": "Tue/Thu 10:00AM–12:00PM",
            "venue": "Room 105, Koitalel Block", "credit_hours": 3
        },
        {
            "unit_code": "SE3101",
            "unit_name": "Software Engineering Principles",
            "school": "SCES", "department": "SE",
            "lecturer": "dr.waweru",
            "year": 3, "semester": 1,
            "schedule": "Mon/Fri 2:00PM–4:00PM",
            "venue": "Room 201, Koitalel Block", "credit_hours": 3
        },
        {
            "unit_code": "IT2101",
            "unit_name": "Networking & Communications",
            "school": "SCES", "department": "IT",
            "lecturer": "mr.njoroge",
            "year": 2, "semester": 1,
            "schedule": "Wed/Fri 8:00AM–10:00AM",
            "venue": "Lab 3, Koitalel Block", "credit_hours": 3
        },
        # SIMS
        {
            "unit_code": "ACT3101",
            "unit_name": "Life Contingencies",
            "school": "SIMS", "department": "ACT",
            "lecturer": "dr.kamau",
            "year": 3, "semester": 1,
            "schedule": "Tue/Thu 8:00AM–10:00AM",
            "venue": "Room 301, Madaraka Block", "credit_hours": 4
        },
        {
            "unit_code": "MIS2101",
            "unit_name": "Systems Analysis & Design",
            "school": "SIMS", "department": "MIS",
            "lecturer": "dr.ndung'u",
            "year": 2, "semester": 1,
            "schedule": "Mon/Wed 10:00AM–12:00PM",
            "venue": "Room 102, Madaraka Block", "credit_hours": 3
        },
        # SBS
        {
            "unit_code": "BBA3101",
            "unit_name": "Strategic Management",
            "school": "SBS", "department": "BBA",
            "lecturer": "prof.mwangi",
            "year": 3, "semester": 1,
            "schedule": "Mon/Wed 2:00PM–4:00PM",
            "venue": "Room 401, SBS Block", "credit_hours": 3
        },
        {
            "unit_code": "BBA2101",
            "unit_name": "Principles of Marketing",
            "school": "SBS", "department": "BBA",
            "lecturer": "prof.mwangi",
            "year": 2, "semester": 1,
            "schedule": "Tue/Thu 2:00PM–4:00PM",
            "venue": "Room 402, SBS Block", "credit_hours": 3
        },
        # SLS
        {
            "unit_code": "LLB3101",
            "unit_name": "Constitutional Law",
            "school": "SLS", "department": "LLB",
            "lecturer": "dr.otieno",
            "year": 3, "semester": 1,
            "schedule": "Mon/Wed/Fri 11:00AM–12:00PM",
            "venue": "Moot Court, SLS Block", "credit_hours": 3
        },
    ])
    unit_ids = [str(uid) for uid in units.inserted_ids]

    print("Seeding students...")
    students = [
        # SCES — CS Year 3
        {"full_name": "Brian Otieno",       "reg_number": "104298/2022", "school": "SCES", "department": "CS",  "year": 3, "semester": 1, "email": "104298@strathmore.edu", "phone": "0712001001", "gender": "Male"},
        {"full_name": "Alice Wanjiku",       "reg_number": "104299/2022", "school": "SCES", "department": "CS",  "year": 3, "semester": 1, "email": "104299@strathmore.edu", "phone": "0712001002", "gender": "Female"},
        {"full_name": "Kevin Mwangi",        "reg_number": "104300/2022", "school": "SCES", "department": "CS",  "year": 3, "semester": 1, "email": "104300@strathmore.edu", "phone": "0712001003", "gender": "Male"},
        {"full_name": "Grace Achieng",       "reg_number": "104301/2022", "school": "SCES", "department": "CS",  "year": 3, "semester": 1, "email": "104301@strathmore.edu", "phone": "0712001004", "gender": "Female"},
        {"full_name": "Dennis Kipchoge",     "reg_number": "104302/2022", "school": "SCES", "department": "CS",  "year": 3, "semester": 1, "email": "104302@strathmore.edu", "phone": "0712001005", "gender": "Male"},
        {"full_name": "Mary Njeri",          "reg_number": "104303/2022", "school": "SCES", "department": "CS",  "year": 3, "semester": 1, "email": "104303@strathmore.edu", "phone": "0712001006", "gender": "Female"},
        # SCES — SE Year 3
        {"full_name": "Samuel Odhiambo",     "reg_number": "104350/2022", "school": "SCES", "department": "SE",  "year": 3, "semester": 1, "email": "104350@strathmore.edu", "phone": "0712001007", "gender": "Male"},
        {"full_name": "Faith Mutua",         "reg_number": "104351/2022", "school": "SCES", "department": "SE",  "year": 3, "semester": 1, "email": "104351@strathmore.edu", "phone": "0712001008", "gender": "Female"},
        # SCES — IT Year 2
        {"full_name": "Peter Kariuki",       "reg_number": "104400/2023", "school": "SCES", "department": "IT",  "year": 2, "semester": 1, "email": "104400@strathmore.edu", "phone": "0712001009", "gender": "Male"},
        {"full_name": "Lydia Chebet",        "reg_number": "104401/2023", "school": "SCES", "department": "IT",  "year": 2, "semester": 1, "email": "104401@strathmore.edu", "phone": "0712001010", "gender": "Female"},
        # SIMS — Actuarial Year 3
        {"full_name": "James Maina",         "reg_number": "105100/2022", "school": "SIMS", "department": "ACT", "year": 3, "semester": 1, "email": "105100@strathmore.edu", "phone": "0712001011", "gender": "Male"},
        {"full_name": "Winnie Adhiambo",     "reg_number": "105101/2022", "school": "SIMS", "department": "ACT", "year": 3, "semester": 1, "email": "105101@strathmore.edu", "phone": "0712001012", "gender": "Female"},
        {"full_name": "Tony Kimani",         "reg_number": "105102/2022", "school": "SIMS", "department": "ACT", "year": 3, "semester": 1, "email": "105102@strathmore.edu", "phone": "0712001013", "gender": "Male"},
        # SIMS — MIS Year 2
        {"full_name": "Ruth Wangari",        "reg_number": "105200/2023", "school": "SIMS", "department": "MIS", "year": 2, "semester": 1, "email": "105200@strathmore.edu", "phone": "0712001014", "gender": "Female"},
        {"full_name": "Collins Ochieng",     "reg_number": "105201/2023", "school": "SIMS", "department": "MIS", "year": 2, "semester": 1, "email": "105201@strathmore.edu", "phone": "0712001015", "gender": "Male"},
        # SBS — BBA Year 3
        {"full_name": "Sandra Njoki",        "reg_number": "106100/2022", "school": "SBS",  "department": "BBA", "year": 3, "semester": 1, "email": "106100@strathmore.edu", "phone": "0712001016", "gender": "Female"},
        {"full_name": "Michael Rotich",      "reg_number": "106101/2022", "school": "SBS",  "department": "BBA", "year": 3, "semester": 1, "email": "106101@strathmore.edu", "phone": "0712001017", "gender": "Male"},
        {"full_name": "Amina Hassan",        "reg_number": "106102/2022", "school": "SBS",  "department": "BBA", "year": 3, "semester": 1, "email": "106102@strathmore.edu", "phone": "0712001018", "gender": "Female"},
        # SBS — BBA Year 2
        {"full_name": "Steve Mugo",          "reg_number": "106200/2023", "school": "SBS",  "department": "BBA", "year": 2, "semester": 1, "email": "106200@strathmore.edu", "phone": "0712001019", "gender": "Male"},
        {"full_name": "Claire Wambui",       "reg_number": "106201/2023", "school": "SBS",  "department": "BBA", "year": 2, "semester": 1, "email": "106201@strathmore.edu", "phone": "0712001020", "gender": "Female"},
        # SLS — LLB Year 3
        {"full_name": "David Ngugi",         "reg_number": "107100/2022", "school": "SLS",  "department": "LLB", "year": 3, "semester": 1, "email": "107100@strathmore.edu", "phone": "0712001021", "gender": "Male"},
        {"full_name": "Patricia Auma",       "reg_number": "107101/2022", "school": "SLS",  "department": "LLB", "year": 3, "semester": 1, "email": "107101@strathmore.edu", "phone": "0712001022", "gender": "Female"},
        {"full_name": "Hassan Abdi",         "reg_number": "107102/2022", "school": "SLS",  "department": "LLB", "year": 3, "semester": 1, "email": "107102@strathmore.edu", "phone": "0712001023", "gender": "Male"},
    ]

    student_result = await db["students"].insert_many(students)
    student_ids = [str(sid) for sid in student_result.inserted_ids]

    print("Seeding attendance records (past 2 weeks)...")
    attendance_records = []
    statuses = ["present", "present", "present", "present", "absent", "late"]  # weighted towards present

    today = date.today()
    for days_ago in range(14, 0, -1):
        record_date = today - timedelta(days=days_ago)
        if record_date.weekday() >= 5:  # skip weekends
            continue
        for i, student in enumerate(students):
            # assign unit based on department
            dept = student["department"]
            if dept == "CS":
                unit_id = unit_ids[0]   # CS3101
            elif dept == "SE":
                unit_id = unit_ids[2]   # SE3101
            elif dept == "IT":
                unit_id = unit_ids[3]   # IT2101
            elif dept == "ACT":
                unit_id = unit_ids[4]   # ACT3101
            elif dept == "MIS":
                unit_id = unit_ids[5]   # MIS2101
            elif dept == "BBA":
                unit_id = unit_ids[6]   # BBA3101
            elif dept == "LLB":
                unit_id = unit_ids[8]   # LLB3101
            else:
                continue

            attendance_records.append({
                "student_id": student["reg_number"],
                "unit_id": unit_id,
                "department": dept,
                "school": student["school"],
                "date": str(record_date),
                "status": random.choice(statuses),
                "marked_by": "dr.omondi" if dept in ["CS", "SE", "IT"] else
                             "dr.kamau"  if dept in ["ACT", "MIS"] else
                             "prof.mwangi" if dept == "BBA" else "dr.otieno",
                "academic_year": "2024/2025",
                "semester": 1
            })

    await db["attendance"].insert_many(attendance_records)

    print("\n========================================")
    print("  Strathmore University Attendance DB")
    print("  Seeded successfully!")
    print("========================================")
    print(f"  Schools      : 8")
    print(f"  Departments  : 15")
    print(f"  Lecturers    : 7")
    print(f"  Units        : 9")
    print(f"  Students     : {len(students)}")
    print(f"  Attendance   : {len(attendance_records)} records (2 weeks)")
    print("----------------------------------------")
    print("  Login credentials:")
    print("  admin        / admin123")
    print("  dr.omondi    / lecturer123  (SCES)")
    print("  dr.waweru    / lecturer123  (SCES)")
    print("  dr.kamau     / lecturer123  (SIMS)")
    print("  prof.mwangi  / lecturer123  (SBS)")
    print("  dr.otieno    / lecturer123  (SLS)")
    print("========================================\n")

asyncio.run(seed())