# AchievePro — KPI Tracker System

AchievePro is a modern, high-performance Key Performance Indicator (KPI) tracking platform. Built for corporate and team environment configurations, it enables managers to assign, monitor, and verify progress objectives while providing staff members with automated predictive analytics and seamless progress submissions.

---

## 🚀 Key Features

### 1. Unified KPI Prediction Engine
* **Trajectory Forecasting**: Centralized service predicting deadline outcomes based on elapsed time and daily velocity rates ($\text{velocity} = \text{progress} / \text{days\_elapsed}$).
* **Automatic Status Classification**: Projects KPI completion rates to categorize staff metrics as **On Track** ($\ge 80\%$), **At Risk** ($50\%\text{--}79\%$), or **Off Track** ($< 50\%$).
* **Linear Trajectory Charting**: Scales expected target progression smoothly across weekly intervals (Weeks 1 to 4/5) to plot projection curve charts in Recharts without visual dips.

### 2. Stateful Session & Security (RBAC)
* **Token Verification**: Custom JWT authentication validating signature, expiration, and unique `jti` codes against active Firestore session records.
* **Instant Logout Revocation**: Secure logout logic that updates server-side session documents to `revoked: True`, blocking further requests immediately.
* **Role-Based Guards**: Restricts endpoint access strictly through verified `staff` and `manager` roles, raising a `403 Forbidden` response for unauthorized requests.

### 3. Dynamic PDF Report Generator
* **ReportLab Engine**: Compiles real-time metrics, average progress, and submission lists dynamically into printable document buffers.
* **Streaming Delivery**: Returns documents immediately to client browsers via FastAPI's `StreamingResponse` without saving static payloads on server storage.

### 4. Interactive Progress Modals
* **Custom Alert Dialogs**: Validation checks (empty value, negative bounds, target overflows) rendered natively inside modal frames rather than native browser window alerts.
* **Checkmark Success Templates**: Shift progress forms smoothly into clean checkmark screens on submission.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, Recharts, Vanilla CSS, HTML5 |
| **Backend** | Python, FastAPI, PyJWT, ReportLab |
| **Database** | Google Cloud Firestore (NoSQL) |
| **Testing** | Pytest, unittest.mock |

---

## 📁 Repository Directory Structure

```
├── backend/
│   ├── config/            # Firebase client configurations
│   ├── models/            # Pydantic schema schemas
│   ├── routes/            # FastAPI router paths (KPI, Auth, Users)
│   ├── services/          # Business service logic (KPI, Manager, Predictions)
│   ├── tests/             # Pytest test suite (Database, Functional, Integration, Unit)
│   ├── utils/             # Helper classes (Security, Authentication helpers)
│   ├── main.py            # Main API entrypoint
│   └── requirements.txt   # Pip dependency references
├── frontend/
│   ├── src/
│   │   ├── api/           # API fetch wrappers
│   │   ├── components/    # Reusable widgets (charts, modal views)
│   │   ├── pages/         # Page components (staff/manager dashboards)
│   │   └── Main.jsx       # App initialization
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## ⚙️ Installation & Local Setup

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
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   python main.py
   ```
   *The API documentation is available at `http://localhost:8000/docs`.*

### 2. Running the Frontend Client
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install node package dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *The client app is available at `http://localhost:5173`.*

---

## 🧪 Running Automated Tests

Run the complete suite of database, functional, unit, and integration tests using pytest:
```bash
python -m pytest backend/tests/ -v
```
