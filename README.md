# 🌿 EcoLens

An AI-powered environmental reporting platform for organizations — universities, corporate campuses, housing societies, or any managed space.

Members photograph waste or resource misuse, Gemini AI classifies the issue, and a geo-tagged ticket is automatically routed to the responsible department for resolution.

---

## ✨ Features

- **AI Image Classification** — Google Gemini Vision classifies issues into 5 categories: Organic, Recyclable, Hazardous, General Waste, Resource Wastage
- **Geo-tagged Tickets** — Reports are pinned to GPS coordinates and auto-assigned to the nearest department
- **Geofencing** — Server-side polygon boundary check; reports must come from within the defined zone
- **Role-Based Access** — Student / Staff / Dept Staff / Warden / Admin, each with scoped views
- **Gamification** — Points, badges, sustainability score (0–100), and leaderboard
- **Live Issue Map** — React-Leaflet heatmap of all open tickets
- **Analytics Dashboard** — Ticket trends, category breakdown, top problem zones
- **Resource Monitoring** — Electricity, water, WiFi device/bandwidth sensor readings with Z-score anomaly detection

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS, Recharts, React-Leaflet |
| Backend | FastAPI (Python 3.11), SQLAlchemy ORM, PostgreSQL |
| AI | Google Gemini API (vision), Pandas (anomaly detection) |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Deploy | Frontend → Vercel · Backend → Render |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### 1. Clone the repo

```bash
git clone https://github.com/Rizzzzz-bit/EcoLens.git
cd EcoLens
```

### 2. Backend setup

```bash
cd backend
cp ../.env.example .env          # fill in your values
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.  
On first startup, tables are created and demo data is seeded automatically.

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env.local       # set VITE_API_URL if needed
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## ⚙️ Environment Variables

### Backend (`.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret (keep this strong) |
| `ALGORITHM` | JWT algorithm — `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime — `1440` (24 h) |
| `UPLOAD_DIR` | Directory for uploaded images — `uploads` |
| `GEMINI_API_KEY` | Google Gemini API key |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (e.g. your Vercel URL) |

### Frontend (`.env.local`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL (e.g. `https://your-backend.onrender.com`) |

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@ecolens.in` | `password123` |
| Student | `user@ecolens.in` | `password123` |

---

## 📁 Project Structure

```
EcoLens/
├── backend/
│   ├── app/
│   │   ├── ai/              # Gemini classifier + anomaly detection
│   │   ├── config/          # Gamification config, geofence polygon
│   │   ├── routers/         # FastAPI route handlers
│   │   ├── services/        # Gamification logic
│   │   ├── db.py            # SQLAlchemy engine + session
│   │   ├── models.py        # ORM models
│   │   ├── schemas.py       # Pydantic schemas
│   │   └── main.py          # App entry point
│   ├── scripts/
│   │   └── seed.py          # Demo data seeder
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client + typed API calls
│   │   ├── components/      # Shared UI components
│   │   ├── contexts/        # Auth context
│   │   ├── layouts/         # Dashboard layout
│   │   ├── pages/           # Route-level page components
│   │   └── types.ts         # TypeScript interfaces
│   └── package.json
├── render.yaml              # Render deploy config
└── README.md
```

---

## 🌐 Deployment

### Render (Backend)

1. Connect your GitHub repo on [render.com](https://render.com)
2. Use `render.yaml` — it provisions a PostgreSQL database and web service automatically
3. Set `GEMINI_API_KEY` and `ALLOWED_ORIGINS` manually in the Render dashboard (marked `sync: false` in `render.yaml`)

### Vercel (Frontend)

1. Import the repo on [vercel.com](https://vercel.com)
2. Set root directory to `frontend`
3. Add environment variable: `VITE_API_URL=https://<your-render-service>.onrender.com`

---

## 📄 License

MIT
