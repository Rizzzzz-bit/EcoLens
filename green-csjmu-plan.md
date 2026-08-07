# EcoCSJMU — AI-Powered Sustainability Platform: Implementation Plan

## Top-Level Overview

**Goal:** Build a full-stack web application ("EcoCSJMU") where any CSJMU student or staff member can photograph waste or resource misuse on campus, have AI classify and geo-tag it, auto-generate a routed ticket for the responsible department, track resolution, earn gamification rewards, and let admins visualise problem zones on a live campus heatmap.

**Stack:** React + TypeScript (frontend) · FastAPI + Python (backend + AI) · PostgreSQL (data store)

**Core User Workflow:**
1. User opens the app and photographs garbage / resource wastage on campus
2. AI analyses the image → returns category (organic / recyclable / hazardous / general / resource-wastage) + recommended action
3. System creates a geo-tagged `Ticket` assigned to the responsible department
4. Reporter tracks status: `raised → in-progress → resolved`
5. Points awarded to reporter on submission; additional points on resolution
6. Heatmap on campus map shows live density of open tickets by location

**User Roles:**
- **Student / Staff** — report issues, earn points, view personal score and leaderboard
- **Department Staff** — manage and update tickets assigned to their department
- **Hostel Warden** — same as Department Staff but scoped to hostel zones
- **Admin** — full visibility, heatmap, analytics, user management, leaderboard overrides

**Non-Goals:**
- Real IoT / MQTT sensor hardware
- Native mobile app (web-only, camera via browser `<input capture>`)
- Payment / billing features
- Real GPS (campus zone is simulated with fixed coordinate grid)

---

## Architecture Overview

```
[React SPA]
  ├── Camera capture (browser input)
  ├── Leaflet.js campus map + heatmap
  └── Recharts dashboards
        │ REST (JWT)
        ▼
[FastAPI Backend]
  ├── /tickets  — CRUD + status transitions
  ├── /ai       — image classification, scoring, recommendations
  ├── /users    — auth, scores, badges
  ├── /leaderboard
  └── /heatmap  — aggregated geo data
        │ SQLAlchemy ORM
        ▼
[PostgreSQL]
  tickets, ticket_images, users, badges,
  user_badges, reward_points, departments,
  sensor_readings (energy/water/router)
```

**Key Domain Entities:**
- `Department` — campus department or hostel block; owns a geo-zone polygon and receives tickets
- `Ticket` — a reported issue with image URL, AI category, lat/lng, status, reporter, assigned department
- `TicketImage` — stored image file reference (uploaded via multipart)
- `User` — campus member with role; owns a sustainability score and point total
- `RewardPoint` — log entry: user, points, reason (report submitted / ticket resolved / streak bonus)
- `Badge` / `UserBadge` — gamification milestone markers
- `SustainabilityScore` — per-user AI-computed score updated on each report/action
- `SensorReading` — energy / water / router time-series data (campus intelligence layer)

---

## Sub-Tasks

---

### Sub-Task 1 — Project Scaffolding & Repository Structure

**Intent:** Set up the monorepo layout, dependency manifests, Docker Compose for local dev, and shared configuration so every subsequent sub-task has a consistent foundation to build on.

**Expected Outcomes:**
- `backend/` FastAPI app boots with `uvicorn` and returns `{"status": "ok"}` at `GET /health`
- `frontend/` React + Vite app boots and shows a placeholder home page
- `docker-compose.yml` starts PostgreSQL + backend + frontend in one command
- `.env.example` documents all required environment variables
- File upload directory `backend/uploads/` is created and served as a static mount

**Todo List:**
1. Create `backend/` with `requirements.txt`: `fastapi`, `uvicorn`, `sqlalchemy`, `alembic`, `psycopg2-binary`, `pydantic`, `python-multipart`, `pillow`, `scikit-learn`, `pandas`, `numpy`, `python-jose`, `passlib`, `leaflet` (frontend only — note here for reference)
2. Create `backend/app/main.py` with FastAPI instance, CORS middleware, `/health` route, and static file mount for `/uploads`
3. Create `frontend/` using `npm create vite@latest -- --template react-ts`; install `axios`, `react-router-dom`, `recharts`, `tailwindcss`, `leaflet`, `react-leaflet`
4. Create `docker-compose.yml` with services: `db` (postgres:15), `backend`, `frontend`
5. Create `.env.example` with: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `UPLOAD_DIR`
6. Add root `README.md` with local setup and run instructions

**Relevant Context:** No existing codebase — greenfield. `python-multipart` is required for FastAPI file upload support. `react-leaflet` wraps Leaflet.js for the campus heatmap.

**Status:** [ ] pending

---

### Sub-Task 2 — Database Schema, Migrations & Seed Data

**Intent:** Define all PostgreSQL tables as SQLAlchemy ORM models, run Alembic migrations, and seed realistic demo data so every feature is testable from day one.

**Expected Outcomes:**
- All ORM models exist under `backend/app/models/`
- Alembic generates and applies a clean initial migration
- Seed script populates:
  - 10 departments / zones (5 academic + 5 hostels), each with a geo-zone centre coordinate
  - 30 users spread across all roles
  - 150 tickets across all statuses (`raised`, `in-progress`, `resolved`), spread across campus zones over the last 90 days
  - 5 badge definitions
  - 6 months of hourly sensor readings (electricity, water, router devices/bandwidth) per building

**Todo List:**
1. Create `backend/app/db.py` with SQLAlchemy `Base`, `engine`, and `get_db` session dependency
2. Create ORM models:
   - `Department` (id, name, type: academic/hostel, lat, lng, assigned_staff_ids)
   - `Ticket` (id, reporter_id, department_id, category, action_recommendation, image_url, lat, lng, status, created_at, resolved_at)
   - `TicketImage` (id, ticket_id, file_path, uploaded_at)
   - `User` (id, name, email, hashed_password, role, department_id, total_points, sustainability_score)
   - `RewardPoint` (id, user_id, points, reason, ticket_id, created_at)
   - `Badge` (id, name, description, threshold_points, icon_url)
   - `UserBadge` (id, user_id, badge_id, awarded_at)
   - `SensorReading` (id, department_id, metric: enum, value, recorded_at)
3. Run `alembic init alembic` and write the initial migration
4. Create `backend/scripts/seed.py`:
   - Generate tickets with random lat/lng within each department's geo-zone
   - Use weighted randomness for categories (organic 40%, recyclable 30%, general 20%, hazardous 5%, resource-wastage 5%)
   - Spread statuses: 30% raised, 40% in-progress, 30% resolved
   - Generate realistic sensor time-series (sinusoidal daily patterns + noise)
5. Document the full schema in `backend/SCHEMA.md`

**Relevant Context:** `Ticket.lat` / `Ticket.lng` drive the campus heatmap. `Ticket.category` is set by the AI classifier in Sub-Task 4. All other sub-tasks depend on this schema being stable.

**Status:** [ ] pending

---

### Sub-Task 3 — Authentication & Role-Based Access

**Intent:** Implement JWT-based login/logout and reusable role guards so each user type sees only what they are permitted to access.

**Expected Outcomes:**
- `POST /auth/login` returns a JWT access token (email + password)
- `GET /auth/me` returns authenticated user's profile, role, points, and score
- FastAPI dependencies `get_current_user` and `require_role(roles: list)` are available for all routes
- Frontend `AuthContext` holds user state + token; attaches token to every Axios request via interceptor
- Unauthenticated or wrong-role requests return HTTP 401 / 403
- Login page redirects to the correct role-based dashboard on success

**Todo List:**
1. Create `backend/app/routers/auth.py` with `POST /auth/login` and `GET /auth/me`
2. Implement `passlib` bcrypt hashing and `python-jose` JWT encoding/decoding
3. Create `backend/app/dependencies.py` with `get_current_user` and `require_role` dependencies
4. Create `frontend/src/contexts/AuthContext.tsx` — stores `user` + `token` in React state; provides `login()` and `logout()`
5. Create Axios instance in `frontend/src/api/client.ts` with a request interceptor that attaches `Authorization: Bearer <token>`
6. Create `frontend/src/components/PrivateRoute.tsx` — redirects to `/login` if unauthenticated; redirects to role-correct dashboard
7. Create `frontend/src/pages/Login.tsx`

**Relevant Context:** Seed data (Sub-Task 2) must exist before testing login. Role-to-dashboard mapping: `student/staff → /dashboard`, `department_staff → /dept-portal`, `warden → /warden-portal`, `admin → /admin`.

**Status:** [ ] pending

---

### Sub-Task 4 — AI Image Classifier (Core Feature)

**Intent:** Build the AI pipeline that accepts a photo upload, classifies the waste/issue type, and returns the category and recommended action. This is the central innovation of the platform.

**Expected Outcomes:**
- `POST /ai/classify` accepts a multipart image upload; returns `{ category, confidence, action_recommendation, eco_tip }`
- Categories: `organic`, `recyclable`, `hazardous`, `general_waste`, `resource_wastage`
- Action recommendations are text strings (e.g. "Route to Green Bin", "Alert maintenance for water leak", "Hazardous disposal — contact safety office")
- Classification uses a pre-trained MobileNetV2 (via `torchvision`) with ImageNet label → waste category mapping
- Fallback: if `torch` is too heavy for demo, use a lightweight keyword-based label lookup (still uses MobileNetV2 top-5 labels from a smaller `timm` model or OpenCV colour heuristics)
- Response time target: under 3 seconds for a standard campus photo

**Todo List:**
1. Add `torch`, `torchvision` (or `timm` as a lighter alternative) to `requirements.txt`
2. Create `backend/app/ai/classifier.py`:
   - `load_model()` — loads MobileNetV2 once at startup into module-level cache
   - `classify_image(image_bytes) -> ClassificationResult` — preprocesses image, runs inference, maps top-1 ImageNet label to waste category via lookup dict
3. Create `backend/app/ai/category_map.py` — the ImageNet label → waste category mapping dict (e.g. `"banana" → organic`, `"plastic_bottle" → recyclable`, `"fire_extinguisher" → hazardous`, `"pipe" → resource_wastage`)
4. Create `backend/app/ai/action_map.py` — category → action recommendation text + eco tip
5. Create `backend/app/routers/ai.py` with `POST /ai/classify` endpoint
6. Load the model at FastAPI app startup using a `lifespan` context manager (not on first request)
7. Write unit tests for the category mapping logic with mocked inference output

**Relevant Context:** The `/ai/classify` response feeds directly into `POST /tickets` (Sub-Task 5). `pillow` is already in dependencies for image preprocessing.

**Status:** [ ] pending

---

### Sub-Task 5 — Ticket System (Report → Route → Resolve)

**Intent:** Implement the full lifecycle of a campus issue ticket: creation from a classified photo, assignment to the responsible department, status transitions, and resolution tracking.

**Expected Outcomes:**
- `POST /tickets` — authenticated user submits an image + lat/lng; endpoint calls `/ai/classify` internally, creates ticket, saves image, assigns to nearest/responsible department, awards reporter points
- `GET /tickets` — paginated list; filterable by status, category, department; scoped by role (students see own tickets; dept staff see their dept's tickets; admin sees all)
- `GET /tickets/{id}` — full ticket detail with image URL, AI result, status history
- `PATCH /tickets/{id}/status` — dept staff / warden / admin can move status to `in-progress` or `resolved`; resolving awards additional points to reporter
- `GET /tickets/heatmap` — returns `[{lat, lng, weight}]` for all open tickets (used by map)

**Ticket Routing Logic:**
- Each `Department` has a geo-zone centre `(lat, lng)`
- On ticket creation, compute Euclidean distance from ticket coordinates to all department centres
- Assign to the nearest department (or use category override: `hazardous` always routes to Safety Office)

**Todo List:**
1. Create `backend/app/routers/tickets.py`
2. Implement `POST /tickets`:
   - Accept `multipart/form-data` with `image` file + `lat`, `lng` fields
   - Call `classifier.classify_image()` on the uploaded bytes
   - Save image to `UPLOAD_DIR`, store path in `TicketImage`
   - Create `Ticket` record with AI results and assigned department (nearest-dept logic)
   - Call `gamification.award_points(user, "report_submitted")` (Sub-Task 6)
3. Implement `GET /tickets` with role-scoped filtering
4. Implement `GET /tickets/{id}`
5. Implement `PATCH /tickets/{id}/status` with role guard (dept_staff / warden / admin only)
   - On transition to `resolved`: call `gamification.award_points(reporter, "ticket_resolved")`
6. Implement `GET /tickets/heatmap` returning `[{lat, lng, weight}]` (weight = 1 for raised, 0.5 for in-progress)
7. Write integration tests for ticket creation and status transitions

**Relevant Context:** Depends on AI classifier (Sub-Task 4) and gamification service (Sub-Task 6). Department geo-zone data comes from seed (Sub-Task 2).

**Status:** [ ] pending

---

### Sub-Task 6 — Gamification Engine (Points, Badges, Scores, Recommendations)

**Intent:** Reward users for every report and resolved action, compute individual sustainability scores, expose leaderboards, and generate AI-based personalised habit recommendations.

**Expected Outcomes:**
- Points awarded automatically: `report_submitted` = 10 pts, `ticket_resolved` = 20 pts (to reporter), `streak_bonus` = 5 pts/day for 3+ consecutive days reporting
- Individual sustainability score (0–100) computed from: report frequency, resolution rate of own-dept tickets, badge count — updated after each point event
- `GET /leaderboard/users` — top users by points; filterable by department/hostel
- `GET /leaderboard/departments` — departments ranked by total points of their members
- `GET /users/{id}/badges` — user's earned badges
- `GET /users/me/recommendations` — 3 personalised tips based on the user's last 20 activities (rule-based: suggest least-performed eco-action types from the global popular list)
- Badge unlock examples: "First Reporter" (1 ticket), "Eco Warrior" (50 pts), "Problem Solver" (10 resolved tickets in dept)

**Todo List:**
1. Create `backend/app/services/gamification.py`:
   - `award_points(user_id, reason, ticket_id, db)` — inserts `RewardPoint`, updates `User.total_points`, checks badge thresholds, updates `User.sustainability_score`
   - `check_badge_unlocks(user_id, db)` — iterates badge thresholds, inserts `UserBadge` for newly earned badges
   - `compute_sustainability_score(user_id, db) -> float` — weighted formula: report frequency 40%, dept resolution rate 30%, badge count 20%, streak 10%
2. Create `backend/app/services/recommender.py`:
   - `get_recommendations(user_id, db) -> list[str]` — rule-based: finds the 3 eco-action categories the user has reported least vs. campus average; returns tip strings
3. Create `backend/app/routers/leaderboard.py` with `GET /leaderboard/users` and `GET /leaderboard/departments`
4. Create `backend/app/routers/users.py` with `GET /users/{id}/badges`, `GET /users/me/recommendations`, `GET /users/me/stats`
5. Define point values and badge thresholds in `backend/app/config/gamification.py` (not hardcoded in service)
6. Update seed script (Sub-Task 2) to include badge definitions and seed `RewardPoint` entries consistent with seeded tickets

**Relevant Context:** `award_points` is called from `POST /tickets` and `PATCH /tickets/{id}/status`. Sustainability score feeds the per-user score card on the dashboard.

**Status:** [ ] pending

---

### Sub-Task 7 — Campus Intelligence: Heatmap & Analytics

**Intent:** Surface a live geo-heatmap on a campus map showing problem density by zone, plus historical trend charts to help admins prioritise cleanup routes and identify recurring hotspots.

**Expected Outcomes:**
- Campus map rendered with `react-leaflet`; heatmap overlay powered by `leaflet.heat` showing open ticket density by location
- Map auto-refreshes every 60 s to pick up new reports
- Admin analytics panel shows:
  - Bar chart: tickets by category over last 30 days
  - Line chart: tickets raised vs. resolved per week (trend)
  - Table: top 5 recurring problem zones (departments with highest open ticket counts)
  - `GET /analytics/summary` — returns all data above in one response

**Todo List:**
1. Add `leaflet.heat` (via CDN script tag in `index.html` or npm `leaflet.heat`) to the frontend
2. Create `backend/app/routers/analytics.py` with `GET /analytics/summary`:
   - Tickets by category (last 30 days)
   - Weekly raised vs. resolved counts (last 12 weeks)
   - Top 5 departments by open ticket count
3. Create `frontend/src/pages/CampusMap.tsx`:
   - Renders `react-leaflet` `MapContainer` centred on CSJMU campus coordinates
   - Fetches `GET /tickets/heatmap` and passes points to `leaflet.heat` layer
   - Markers for each open ticket; click opens a popup with category + status
   - Polls heatmap data every 60 s
4. Create `frontend/src/pages/AdminAnalytics.tsx` with the three charts (Recharts `BarChart`, `LineChart`) and the top-zones table
5. Wire both pages into the Admin dashboard navigation

**Relevant Context:** `GET /tickets/heatmap` endpoint is defined in Sub-Task 5. Map coordinates for CSJMU campus: approximate centre ~`(26.846, 80.947)`.

**Status:** [ ] pending

---

### Sub-Task 8 — Role-Based Frontend Dashboards & Report Flow UI

**Intent:** Build all four role-specific dashboards and the end-to-end report submission UI (photo capture → AI result preview → ticket confirmation).

**Expected Outcomes:**
- **Report Flow (all roles):** Camera/file input → preview → submit → AI result card → ticket created confirmation with tracking ID
- **Student / Staff Dashboard:** Personal sustainability score gauge, total points, badge shelf, "My Tickets" list with status chips, campus leaderboard, quick-report FAB button
- **Department Staff Portal:** Ticket queue for their department (filterable by status/category), one-click status update, dept-level stats (open/resolved count, avg resolution time)
- **Hostel Warden Portal:** Same as dept staff but hostel-scoped; includes resident leaderboard
- **Admin Dashboard:** All-campus ticket overview, heatmap link, leaderboard (users + departments), analytics charts, user management table, manual AI refresh button
- Responsive layout using Tailwind CSS; works on mobile browsers for on-campus photo capture

**Todo List:**
1. Create `frontend/src/layouts/DashboardLayout.tsx` — sidebar with role-aware nav links, top bar with user avatar + points badge
2. Create shared components:
   - `ScoreGauge.tsx` — Recharts `RadialBarChart` for sustainability score
   - `TicketCard.tsx` — ticket summary with category icon, status chip, time ago
   - `BadgeShelf.tsx` — row of earned badge icons
   - `Leaderboard.tsx` — ranked table (user or department mode)
   - `StatusStepper.tsx` — visual `raised → in-progress → resolved` progress bar
3. Create `frontend/src/pages/ReportPage.tsx`:
   - `<input type="file" accept="image/*" capture="environment">` for camera capture
   - Image preview before submission
   - On submit: `POST /ai/classify` first (show AI result card with category + action), then `POST /tickets` on user confirmation
   - Show created ticket ID with "Track your report" link
4. Create `frontend/src/pages/StudentDashboard.tsx`
5. Create `frontend/src/pages/DeptPortal.tsx`
6. Create `frontend/src/pages/WardenPortal.tsx`
7. Create `frontend/src/pages/AdminDashboard.tsx`
8. Create `frontend/src/api/` — typed Axios hooks: `useTickets`, `useClassify`, `useLeaderboard`, `useUserStats`, `useHeatmap`, `useAnalytics`
9. Wire all pages to React Router with `PrivateRoute` role guards; floating action button on all dashboards links to `/report`

**Relevant Context:** Auth context from Sub-Task 3. All API endpoints from Sub-Tasks 4, 5, 6, 7. Report page is the most demo-critical UI — prioritise it.

**Status:** [ ] pending

---

### Sub-Task 9 — Campus Resource Monitoring (Energy / Water / Router)

**Intent:** Layer the original resource consumption monitoring (energy, water, WiFi router) as a secondary intelligence panel visible to Dept Staff, Wardens, and Admin — providing a complete campus sustainability picture alongside the ticket/report system.

**Expected Outcomes:**
- `GET /buildings/{id}/readings` — time-series readings; `metric` param accepts `electricity`, `water`, `devices`, `bandwidth`
- `GET /buildings/{id}/router` — latest device count + bandwidth snapshot
- `GET /ai/resource-anomalies` — anomalous consumption readings across all buildings (Z-score detection)
- Resource monitoring panel on Dept Staff, Warden, and Admin dashboards with Recharts `LineChart` per metric
- `RouterMonitorCard` component — live device count + bandwidth gauge (polls every 30 s)

**Scoring contribution:** resource efficiency (electricity + water + network) contributes 20% to the department-level sustainability score; individual user score is unaffected.

**Todo List:**
1. Create `backend/app/routers/buildings.py` with `GET /buildings`, `GET /buildings/{id}/readings`, `GET /buildings/{id}/router`
2. Create `backend/app/ai/resource_anomaly.py` — Z-score anomaly detection over 7-day rolling window for all four metric types
3. Add `GET /ai/resource-anomalies` to `backend/app/routers/ai.py`
4. Create `frontend/src/components/RouterMonitorCard.tsx` — polls `GET /buildings/{id}/router` every 30 s
5. Create `frontend/src/components/ResourcePanel.tsx` — tabbed view (electricity / water / devices / bandwidth) with `LineChart` per tab
6. Add `ResourcePanel` and `RouterMonitorCard` to Dept Staff, Warden, and Admin dashboards

**Relevant Context:** Sensor data is pre-seeded (Sub-Task 2). This sub-task depends on Sub-Task 8 (dashboards) being structurally in place so the panels can be added. Treat as additive — it should not block Sub-Tasks 1–8.

**Status:** [ ] pending

---

## Dependency Order

```
Sub-Task 1 (Scaffold)
    └─► Sub-Task 2 (Schema + Seed)
            ├─► Sub-Task 3 (Auth)
            │       └─► Sub-Task 4 (AI Classifier)  ◄─── CORE
            │                   └─► Sub-Task 5 (Ticket System)  ◄─── CORE
            │                               ├─► Sub-Task 6 (Gamification)
            │                               ├─► Sub-Task 7 (Heatmap + Analytics)
            │                               └─► Sub-Task 8 (Dashboards + Report UI)
            │                                               └─► Sub-Task 9 (Resource Monitoring)
```

**Critical path:** Sub-Tasks 1 → 2 → 3 → 4 → 5 must be completed in order. Sub-Tasks 6, 7, 8 can progress in parallel once Sub-Task 5 is done. Sub-Task 9 is additive and last.
