# EcoCSJMU — AI-Powered Campus Sustainability Platform

A full-stack web application where students and staff photograph waste or resource misuse on campus, AI classifies and geo-tags it, auto-generates a routed ticket for the responsible department, and admins see a live campus heatmap.

## Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Recharts + react-leaflet
- **Backend:** FastAPI (Python) + SQLAlchemy + Alembic
- **Database:** PostgreSQL 15
- **AI:** PIL-based colour heuristic classifier (drop-in replaceable with MobileNetV2)

## Quick Start (Docker)

```bash
# 1. Start all services
docker-compose up --build

# 2. Seed the database (first time only)
docker-compose exec backend python -m scripts.seed

# 3. Open the app
open http://localhost:5173
```

## Demo Login Credentials (password: `password123`)

| Role | Email |
|---|---|
| Admin | admin@csjmu.ac.in |
| Student | arjun@student.csjmu.ac.in |
| Dept Staff | verma@csjmu.ac.in |
| Hostel Warden | warden_a@csjmu.ac.in |

## Local Development (without Docker)

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Set DATABASE_URL to a local PostgreSQL instance in backend/.env
uvicorn app.main:app --reload --port 8000
python -m scripts.seed
```

### Frontend
```bash
cd frontend
npm install
# Set VITE_API_URL=http://localhost:8000 in frontend/.env
npm run dev
```

## Features
- 📷 **Photo Report Flow** — Camera capture → AI classification → ticket creation
- 🤖 **AI Classifier** — Colour heuristic (replace with MobileNetV2 for production)
- 🗺️ **Campus Heatmap** — Live OpenStreetMap with ticket density overlay
- 🎫 **Ticket Lifecycle** — raised → in-progress → resolved with role-based access
- 🏆 **Gamification** — Points, badges, individual sustainability score, leaderboard
- 📊 **Analytics** — Category trends, weekly raised/resolved, top problem zones
- 📡 **Router Monitor** — Live WiFi device count + bandwidth gauge per building
- 👥 **4 Role Dashboards** — Student, Dept Staff, Hostel Warden, Admin

## Project Structure
```
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── models.py        # SQLAlchemy ORM models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── dependencies.py  # JWT auth helpers
│   │   ├── db.py            # DB session
│   │   ├── ai/              # Classifier + anomaly detection
│   │   ├── services/        # Gamification logic
│   │   ├── routers/         # All API routes
│   │   └── config/          # Points & badge config
│   └── scripts/seed.py      # Demo data seeder
└── frontend/
    └── src/
        ├── App.tsx           # Router
        ├── api/              # Axios API layer
        ├── contexts/         # AuthContext
        ├── layouts/          # DashboardLayout
        ├── components/       # Shared UI components
        └── pages/            # All page components
```
