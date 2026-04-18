from pydantic import BaseModel
from typing import Literal
from datetime import date

class AttendanceRecord(BaseModel):
    student_id: str
    class_id: str
    date: date
    status: Literal["present", "absent", "late"]

class BulkAttendance(BaseModel):
    class_id: str
    date: date
    records: list[AttendanceRecord]
