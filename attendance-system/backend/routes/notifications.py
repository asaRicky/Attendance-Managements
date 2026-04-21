from fastapi import APIRouter, Depends
from datetime import datetime, timedelta

from database import db
from core.security import get_current_user
from core.email import send_weekly_digest, send_low_attendance_alert

router = APIRouter()


@router.post("/digest/send")
async def trigger_digest(current_user: dict = Depends(get_current_user)):
    """
    Call this manually or from a cron job (e.g. every Monday morning).
    In production wire this to APScheduler or a cron endpoint.
    """
    users = await db["users"].find({"email": {"$exists": True, "$ne": ""}}).to_list(500)
    week_ago = datetime.utcnow() - timedelta(days=7)

    for user in users:
        sessions = await db["attendance"].find({
            "lecturer_username": user["username"],
            "date": {"$gte": week_ago.strftime("%Y-%m-%d")},
        }).to_list(1000)

        if not sessions:
            continue

        unit_totals: dict[str, list] = {}
        for s in sessions:
            u = s.get("unit_code", "Unknown")
            unit_totals.setdefault(u, []).append(s.get("present", False))

        unit_pcts = {u: (sum(v) / len(v) * 100) for u, v in unit_totals.items()}

        stats = {
            "sessions":  len(sessions),
            "students":  len(set(s.get("student_id") for s in sessions)),
            "avg_pct":   sum(unit_pcts.values()) / len(unit_pcts) if unit_pcts else 0,
            "units":     unit_pcts,
        }
        await send_weekly_digest(user["email"], user["full_name"], stats)

    return {"message": f"Digest sent to {len(users)} users."}


@router.post("/check-low-attendance")
async def check_low_attendance(current_user: dict = Depends(get_current_user)):
    """
    Run this after each session to alert lecturers about at-risk students.
    """
    alerted = 0
    classes = await db["classes"].find(
        {"lecturer_username": current_user["username"]}
    ).to_list(100)

    for cls in classes:
        records = await db["attendance"].find(
            {"unit_id": str(cls["_id"])}
        ).to_list(5000)

        by_student: dict[str, list] = {}
        for r in records:
            sid = str(r.get("student_id", ""))
            by_student.setdefault(sid, []).append(r.get("present", False))

        for sid, presences in by_student.items():
            pct = sum(presences) / len(presences) * 100
            if pct < 75:
                student = await db["students"].find_one({"_id": sid})
                sname   = student.get("full_name", sid) if student else sid
                email   = current_user.get("email", "")
                if email:
                    await send_low_attendance_alert(
                        email, current_user["full_name"],
                        cls.get("unit_code", "Unknown"), sname, pct,
                    )
                    alerted += 1

    return {"message": f"{alerted} low-attendance alerts sent."}