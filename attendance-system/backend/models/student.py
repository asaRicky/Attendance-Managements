from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date

class StudentCreate(BaseModel):
    name: str
    student_id: str
    class_name: str
    email: EmailStr
    phone: Optional[str] = None
    enrolled_date: Optional[date] = None

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    class_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
