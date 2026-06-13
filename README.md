# AchievePro — KPI Tracking & Analytical Management Platform

AchievePro is a Key Performance Indicator (KPI) monitoring and analytics platform. It provides managers with tracking metrics and verification controls while offering staff members progress forecasting using an automated prediction engine.

---

## 🏗️ System Architecture & Data Flow Pipelines

### 1. Email Notification Pipeline
This pipeline notifies users when progress updates are submitted or verified. It relies on standard SMTP configuration settings stored in environment variables.

* **Triggers**:
  * **KPI Progress Submission**: Triggered when a staff member uploads current values and files in `/api/kpi/progress` (implemented in [submit_kpi_progress](backend/services/kpi_service.py)).
  * **Submission Verification**: Triggered when a manager reviews (approves or rejects) a submission in `/api/manager/submission/verify` (implemented in [verify_submission](backend/services/manager_service.py)).
* **Execution Flow**:
  1. The backend retrieves the relevant user profile from Firestore's `userData` collection (such as the manager to notify or the staff member's profile).
  2. The text payload is populated with dynamic variables (KPI title, staff name, current value, status, comments).
  3. A call to the central `send_email` utility helper handles SMTP connection initiation, TLS activation (if enabled via `SMTP_USE_TLS`), authorization login, and raw dispatch.

---

### 2. Download PDF Report Pipeline
This pipeline dynamically aggregates performance data and constructs high-fidelity reports as binary data streams without storing files locally on the server.

* **Routes & Endpoints**:
  * `GET /api/report/weekly`: Overall performance summary for active weekly KPIs.
  * `GET /api/report/monthly`: KPI metrics categorized by completed and active status for the current month.
  * `GET /api/report/monthly/me`: Personalized performance report for a specific staff member.
* **Document Construction**:
  1. Handlers perform queries on the `kpiData` collection, calculate mathematical aggregates (e.g. average progress, completion rates), and format the results.
  2. It initiates a virtual buffer stream via Python's `io.BytesIO`.
  3. The **ReportLab** library (`reportlab.pdfgen.canvas.Canvas`) is used to draw layout components (header text, titles, table columns, statistical boxes, and visual dividing grid-lines) onto the page canvas.
  4. The canvas saves, rewinds the buffer offset, and serves the bytes direct to the request payload as a `StreamingResponse` using the `application/pdf` media type, triggering browser downloads with custom attachment filenames.

---

### 3. Prediction Engine Pipeline
The prediction engine analyzes historic velocity to forecast future performance and categorize KPIs as *On Track*, *At Risk*, or *Off Track*.

* **Triggers**:
  * **Manager Endpoint** (`GET /api/manager/kpi/{kpi_id}/predict`): Retrieves prediction metrics for all staff members assigned to a specific KPI, returning week-by-week scaled trajectory lines.
  * **Staff Endpoint** (`GET /api/staff/kpi-prediction`): Returns the current actual and predicted trajectory values for all KPIs assigned to the currently authenticated staff member.
* **Algorithmic Logic**:
  * The trajectory calculations determine elapsed time and compute daily progress velocity ($\text{velocity} = \text{progress} / \text{days\_elapsed}$), projecting this rate across the total assignment duration to forecast expected progress at the deadline.
  * To prevent division-by-zero errors on the start date of an assignment, a fallback projection multiplier of $1.1 \times \text{current}$ progress is automatically applied.

---

## 🔒 Security & Authorization Model

### 1. Stateful Session Management
* During JWT verification, `verify_jwt_token` checks the token's unique identifier (`jti`) against a live Firestore document in the `sessions` collection.
* Calling `logout_user` updates the session record to `revoked: True` in the database, immediately invalidating the JWT and blocking subsequent requests.

### 2. Role-Based Access Control (RBAC)
* The `require_manager` helper function checks that the Firestore user profile's role matches `manager`, and raises an HTTP `403 Forbidden` response if unauthorized.
* The `require_user` helper function extracts user information from the token payload and queries the database to authenticate `staff` roles.

---

## 📋 API Endpoints Specification

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Public | Registers a new user (`staff` or `manager`). |
| **POST** | `/api/auth/login` | Public | Authenticates credentials, generates JWT token, and registers session. |
| **POST** | `/api/auth/logout` | Authenticated | Revokes current JWT session. |
| **GET** | `/api/manager/kpis` | Manager | Retrieves all KPI records with filters. |
| **GET** | `/api/manager/kpi` | Manager | Retrieves a single KPI document. |
| **POST** | `/api/manager/kpi/create` | Manager | Creates a new KPI and sends assignment notifications. |
| **PUT** | `/api/manager/kpi/update/{kpi_id}` | Manager | Updates fields of a specific KPI document. |
| **DELETE** | `/api/manager/kpi/delete/{kpi_id}` | Manager | Deletes a KPI and cascades assignments. |
| **GET** | `/api/manager/kpi/{kpi_id}/predict` | Manager | Estimates KPI trajectory and status mapping for assigned staff. |
| **GET** | `/api/staff/kpi` | Staff | Retrieves KPIs assigned to the authenticated staff member. |
| **GET** | `/api/staff/kpi-prediction` | Staff | Gets current and predicted outcomes for staff KPIs. |
| **GET** | `/api/staff/monthly-performance` | Staff | Compiles monthly progress and prediction vectors. |
| **POST** | `/api/kpi/update` | Staff | Saves progress updates and evidence uploads. |
| **GET** | `/api/report/weekly` | Manager | Downloads the weekly PDF status report. |
| **GET** | `/api/report/monthly` | Manager | Downloads the monthly PDF completion report. |
| **GET** | `/api/report/monthly/me` | Staff | Downloads a staff member's personal monthly summary report. |

---

## ⚙️ Installation & Setup

### Prerequisite Environment
Create a `.env` configuration file in the `backend/` directory:
```env
JWT_SECRET_KEY=your_jwt_secret_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email@gmail.com
SMTP_USE_TLS=true
```

### 1. Running the Backend Server
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   python main.py
   ```

### 2. Running the Frontend Client
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```

---

