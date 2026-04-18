from pydantic import BaseModel
from typing import Literal

class UserCreate(BaseModel):
    username: str
    password: str
    role: Literal["admin", "teacher", "student"] = "teacher"

class UserLogin(BaseModel):
    username: str
    password: str
