# Student Attendance Management System

## Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Python FastAPI
- **Database**: MongoDB (Motor async driver)

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Docs
Visit http://localhost:8000/docs for auto-generated Swagger UI.

# AttendIQ

> **Smart attendance management for modern universities.**  
> Built for lecturers. Loved by students.

---

## What is AttendIQ?

AttendIQ is a full-stack attendance management system designed for university environments. Lecturers can manage students, track class attendance, generate reports, and let students self-register via QR code — all from a clean, fast dashboard.

---

## Screenshots

| Dashboard | Students | Attendance |
|-----------|----------|------------|
| Overview of stats and recent activity | Full student registry with pending approvals | Mark attendance per class session |

---

## Features

- **Authentication** — Secure JWT-based login, registration, email verification, and password reset
- **Student Registry** — Add, edit, and remove students with school/department/year metadata
- **QR Self-Registration** — Generate a QR code per class; students scan and submit their details for lecturer approval
- **Pending Approvals** — Students who self-register land in a pending queue; lecturers approve or reject each entry
- **Courses** — Create and manage classes with unit codes, schedules, venues, and credit hours
- **Attendance Tracking** — Mark attendance session by session, tied to specific courses
- **Reports** — View and export attendance summaries per course or student
- **Settings** — Update profile, change password, manage account

---

## Tech Stack

### Frontend
| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| React Router v6 | Client-side routing |
| Zustand | Auth state management |
| Axios | HTTP client |
| `qrcode` | QR code generation |

### Backend
| Tool | Purpose |
|------|---------|
| FastAPI | REST API framework |
| Motor | Async MongoDB driver |
| MongoDB | Database |
| python-jose | JWT tokens |
| bcrypt | Password hashing |
| Uvicorn | ASGI server |

---

## Project Structure

```
attendance-system/
├── backend/
│   ├── core/
│   │   ├── security.py       # JWT, hashing, auth dependency
│   │   └── email.py          # Email sending utilities
│   ├── models/
│   │   └── student.py        # Pydantic schemas
│   ├── routes/
│   │   ├── auth.py           # Register, login, profile, password
│   │   ├── students.py       # CRUD + self-register + pending approval
│   │   ├── classes.py        # Course management
│   │   ├── attendance.py     # Attendance sessions
│   │   └── reports.py        # Reporting endpoints
│   ├── database.py           # MongoDB connection
│   └── main.py               # FastAPI app entry point
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.js         # Axios instance
    │   ├── components/
    │   │   └── Layout.jsx         # Sidebar + shell
    │   ├── hooks/
    │   │   └── useToast.js        # Toast notifications
    │   ├── pages/
    │   │   ├── Landing.jsx
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Students.jsx       # Registry + QR + pending
    │   │   ├── StudentSelfRegister.jsx  # Public QR landing page
    │   │   ├── Courses.jsx
    │   │   ├── Attendance.jsx
    │   │   ├── Reports.jsx
    │   │   └── Settings.jsx
    │   ├── store/
    │   │   └── authStore.js       # Zustand auth store
    │   └── App.jsx
    └── index.html
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB running locally on port `27017`

---

### 1. Clone the repo

```bash
git clone https://github.com/your-username/attendance-system.git
cd attendance-system
```

---

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Mac/Linux

# Install dependencies
pip install fastapi uvicorn motor pymongo python-jose bcrypt pydantic python-multipart

# Start the server
uvicorn main:app --reload
```

Backend runs at **http://localhost:8000**  
API docs at **http://localhost:8000/docs**

---

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Install QR code package
npm install qrcode

# Start dev server
npm run dev
```

Frontend runs at **http://localhost:5173**

---

### 4. Environment variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8000/api
```

For production, update `SECRET_KEY` in `backend/core/security.py`:

```python
SECRET_KEY = "your-strong-secret-key-here"
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/verify-email?token=` | Verify email address |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Reset with token |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/profile` | Update profile |
| POST | `/api/auth/change-password` | Change password |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students/` | List all enrolled students |
| GET | `/api/students/pending` | List pending self-registrations |
| POST | `/api/students/` | Add student (lecturer) |
| POST | `/api/students/self-register` | Student self-register via QR |
| POST | `/api/students/generate-link` | Generate QR token |
| PATCH | `/api/students/:id/approve` | Approve pending student |
| DELETE | `/api/students/:id/reject` | Reject pending student |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/classes/` | List all courses |
| POST | `/api/classes/` | Create course |
| PATCH | `/api/classes/:id` | Update course |
| DELETE | `/api/classes/:id` | Delete course |

---

## QR Self-Registration Flow

```
Lecturer                          Student
   │                                 │
   ├─ Click "QR Register"            │
   ├─ Select school + department     │
   ├─ Generate QR code ─────────────►│
   │                                 ├─ Scan QR
   │                                 ├─ Fill name, ID, email
   │                                 ├─ Submit form
   │                                 │
   │◄── Entry appears in Pending tab─┤
   ├─ Review submission              │
   ├─ Click Approve / Reject         │
   │                                 │
   └─ Student added to registry      │
```

---

## Database Collections

| Collection | Description |
|------------|-------------|
| `users` | Lecturer accounts |
| `students` | Student records (`status: approved / pending`) |
| `classes` | Course definitions |
| `attendance` | Attendance session records |
| `register_tokens` | QR self-register tokens |

---

## Roadmap

- [ ] Email notifications on approval/rejection
- [ ] Bulk import students via CSV
- [ ] Face recognition attendance marking
- [ ] Mobile app for students
- [ ] Export reports to PDF/Excel
- [ ] Multi-institution support

---

## Contributing

1. Fork the repository
2. Create a feature branch — `git checkout -b feature/your-feature`
3. Commit your changes — `git commit -m 'Add some feature'`
4. Push to the branch — `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT License — feel free to use, modify, and distribute.

---

<div align="center">
  Built by ❤️ Derrick Omondi 
</div>