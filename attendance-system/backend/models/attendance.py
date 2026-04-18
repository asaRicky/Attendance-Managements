# backend/models/attendance.py
from pydantic import BaseModel, validator
from typing import List, Literal
import re


class AttendanceRecord(BaseModel):
    student_id: str          # numeric string e.g. "104298"
    class_id:   str          # MongoDB _id of the class
    date:       str          # YYYY-MM-DD
    status:     Literal["present", "absent", "late"]
    marked_by:  str          # lecturer username

    @validator("student_id")
    def must_be_numeric(cls, v):
        if not v.strip().isdigit():
            raise ValueError("student_id must be numeric only e.g. '104298'")
        return v.strip()

    @validator("date")
    def valid_date(cls, v):
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("date must be YYYY-MM-DD")
        return v


class BulkAttendance(BaseModel):
    class_id: str
    date:     str
    records:  List[AttendanceRecord]