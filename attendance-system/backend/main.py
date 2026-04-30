from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import students, attendance, auth, reports, classes
from routes import feedback, notifications          # ← add this line
from database import create_indexes

app = FastAPI(title="AttendIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # ← add frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router,            prefix="/api/auth",          tags=["Auth"])              # ← ensure auth router is included
app.include_router(students.router,        prefix="/api/students",       tags=["Students"])
app.include_router(attendance.router,      prefix="/api/attendance",     tags=["Attendance"])
app.include_router(reports.router,         prefix="/api/reports",        tags=["Reports"])
app.include_router(classes.router,         prefix="/api/classes",        tags=["Classes"])
app.include_router(feedback.router,        prefix="/api/feedback",       tags=["Feedback"])          # ← new
app.include_router(notifications.router,   prefix="/api/notifications",  tags=["Notifications"])     # ← new

@app.on_event("startup")
async def startup():
    await create_indexes()

@app.get("/")
def root():
    return {"message": "AttendIQ API running"}