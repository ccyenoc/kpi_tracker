# AchievePro — KPI Tracking & Analytical Management Platform

AchievePro is a Key Performance Indicator (KPI) monitoring and analytics platform. It provides managers with tracking metrics and verification controls while offering staff members progress forecasting using an automated prediction engine.

---

## System Architecture & Data Flow Pipelines

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
  * The trajectory calculations determine elapsed time and compute daily progress velocity , projecting this rate across the total assignment duration to forecast expected progress at the deadline.
  * To prevent division-by-zero errors on the start date of an assignment, a fallback projection multiplier of $1.1 \times \text{current}$ progress is automatically applied.

---

## Security & Authorization Model

### 1. Stateful Session Management
* During JWT verification, `verify_jwt_token` checks the token's unique identifier (`jti`) against a live Firestore document in the `sessions` collection.
* Calling `logout_user` updates the session record to `revoked: True` in the database, immediately invalidating the JWT and blocking subsequent requests.

### 2. Role-Based Access Control (RBAC)
* The `require_manager` helper function checks that the Firestore user profile's role matches `manager`, and raises an HTTP `403 Forbidden` response if unauthorized.
* The `require_user` helper function extracts user information from the token payload and queries the database to authenticate `staff` roles.

---

## API Endpoints Specification

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/register` | Public | Registers a new user (`staff` or `manager`). |
| **POST** | `/api/login` | Public | Authenticates credentials, generates JWT token, and registers session. |
| **POST** | `/api/logout` | Authenticated | Revokes current JWT session. |
| **GET** | `/api/manager/kpis` | Manager | Retrieves all KPI records with filters. |
| **GET** | `/api/manager/kpi/{kpi_id}` | Manager | Retrieves a single KPI document. |
| **POST** | `/api/manager/kpi` | Manager | Creates a new KPI and sends assignment notifications. |
| **PUT** | `/api/manager/kpi/{kpi_id}` | Manager | Updates fields of a specific KPI document. |
| **DELETE** | `/api/manager/kpi/{kpi_id}` | Manager | Deletes a KPI and cascades assignments. |
| **GET** | `/api/manager/kpi/{kpi_id}/predict` | Manager | Estimates KPI trajectory and status mapping for assigned staff. |
| **GET** | `/api/staff/kpi` | Staff | Retrieves KPIs assigned to the authenticated staff member. |
| **GET** | `/api/staff/kpi-prediction` | Staff | Gets current and predicted outcomes for staff KPIs. |
| **GET** | `/api/staff/monthly-performance` | Staff | Compiles monthly progress and prediction vectors. |
| **POST** | `/api/kpi/update` | Staff | Saves progress updates and evidence uploads. |
| **GET** | `/api/report/weekly` | Manager | Downloads the weekly PDF status report. |
| **GET** | `/api/report/monthly` | Manager | Downloads the monthly PDF completion report. |
| **GET** | `/api/report/monthly/me` | Staff | Downloads a staff member's personal monthly summary report. |

---

## Installation & Setup

### Prerequisite 1: Firebase & Firestore Database Setup
AchievePro uses Firebase Firestore for data storage. You need to configure a Firebase Project:
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Enable **Firestore Database** in your project.
3. Register a new **Web App** in the project settings.
4. Download the **Service Account Credentials file**:
   * Navigate to **Project Settings** > **Service Accounts**.
   * Click **Generate New Private Key**.
   * Save the downloaded `.json` file as `serviceAccountKey.json` inside the `backend/` directory. (This file is mandatory for backend Firebase Admin SDK initialization).

---

### Prerequisite 2: Environment Configurations (.env)

#### 1. Backend Environment Variables (`backend/.env`)
Create a `.env` file in the `backend/` directory (you can copy from `backend/.env.example`) and fill in the values:
```env
# Firebase settings (REQUIRED - copy from Firebase web app SDK config)
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_DATABASE_URL=https://your-project-rtdb.region.firebasedatabase.app
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id
SERVICE_ACCOUNT_KEY_PATH=serviceAccountKey.json

# Session secret
JWT_SECRET_KEY=your_jwt_secret_key_here

# SMTP Email settings (REQUIRED for system notifications & email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email@gmail.com
SMTP_USE_TLS=true
```

#### 2. Frontend Environment Variables (`frontend/.env`)
Create a `.env` file in the `frontend/` directory (you can copy from `frontend/.env.example`) and fill in the Firebase public API values:
```env
# Firebase settings for frontend
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-rtdb.region.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

---

### Prerequisite 3: CORS & Network Configuration (IP Addresses)

* **Localhost Development (Default)**:
  * Backend runs on `http://localhost:8000`.
  * Frontend runs on `http://localhost:5173`.
  * The frontend uses Vite's built-in dev proxy (`frontend/vite.config.js`) to route `/api` to the backend. This proxies calls locally and avoids CORS issues.
  * In the backend, the CORS middleware (`backend/main.py`) allows requests from standard React/Vite development ports (`5173`, `5174`, `3000`).

* **Network Sharing / Testing on Other Devices (IP Setup)**:
  If you want to access the frontend from other devices on the same Wi-Fi network (e.g., testing on a mobile device at `http://192.168.x.x:5173`):
  1. **Expose the Frontend**: Start the Vite server binding to all interfaces:
     ```bash
     npm run dev -- --host
     ```
  2. **Allow Network Access in Backend CORS**: If your frontend calls the backend IP directly (instead of through the relative `/api` proxy), you must update the `allow_origins` list in `backend/main.py` to include your computer's local IP address:
     ```python
     allow_origins=[
         "http://192.168.x.x:5173", # Add your local network IP here
         "http://localhost:5173",
         ...
     ]
     ```

---

### Running the System

#### 1. Running the Backend Server
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
   *Note: The backend automatically creates an `uploads/` directory inside `backend/` to save evidence files submitted by staff members. Ensure the backend process has write permissions.*

#### 2. Running the Frontend Client
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

