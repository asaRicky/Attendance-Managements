from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import students, attendance, auth, reports

app = FastAPI(title="Attendance System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

from database import db, create_indexes

@app.on_event("startup")
async def startup():
    await create_indexes()
    
@app.get("/")
def root():
    return {"message": "Attendance System API running"}
