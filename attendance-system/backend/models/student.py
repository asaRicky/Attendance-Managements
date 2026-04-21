from pydantic import BaseModel
from typing import Optional

class StudentCreate(BaseModel):
    full_name:   str
    student_id:  str
    reg_number:  Optional[str] = ''
    school:      Optional[str] = ''
    department:  Optional[str] = ''
    year:        Optional[int] = 1
    semester:    Optional[int] = 1
    email:       Optional[str] = ''
    phone:       Optional[str] = ''
    gender:      Optional[str] = 'Male'

class StudentUpdate(BaseModel):
    full_name:   Optional[str] = None
    student_id:  Optional[str] = None
    reg_number:  Optional[str] = None
    school:      Optional[str] = None
    department:  Optional[str] = None
    year:        Optional[int] = None
    semester:    Optional[int] = None
    email:       Optional[str] = None
    phone:       Optional[str] = None
    gender:      Optional[str] = None