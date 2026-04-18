from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import students, attendance, auth, reports, classes
from database import create_indexes

app = FastAPI(title="Strathmore Attendance System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,       prefix="/api/auth",       tags=["Auth"])
app.include_router(students.router,   prefix="/api/students",   tags=["Students"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])
app.include_router(reports.router,    prefix="/api/reports",    tags=["Reports"])
app.include_router(classes.router,    prefix="/api/classes",    tags=["Classes"])

@app.on_event("startup")
async def startup():
    await create_indexes()

@app.get("/")
def root():
    return {"message": "Strathmore Attendance System API running"}