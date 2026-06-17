# AchievePro — Step-by-Step Runbook Guide

This document is a step-by-step runbook to configure, run, and connect the AchievePro KPI Tracker web application.

---

## Step 1: Firebase Project Configuration
The application is pre-configured to connect to the Firebase Project ID **`kpitracker-8e8dc`**.

1. **Verify Service Account Certificate**:
   * Ensure that the `serviceAccountKey.json` file is present in the `backend/` directory.
   * *(Note: This file is already in `backend/` directory, so you do not need to download it).*

---

## Step 2: Environment Variable Setup

### 1. Backend Config (`backend/.env`)
Create a `.env` file inside the `backend/` directory and configure the environment variables as follows:

```env
# Firebase settings (Pre-configured for kpitracker-8e8dc)
FIREBASE_API_KEY=AIzaSyBEf4W67vj28e-TGAHIFmKvjyYr1GrfTeY
FIREBASE_AUTH_DOMAIN=kpitracker-8e8dc.firebaseapp.com
FIREBASE_DATABASE_URL=https://kpitracker-8e8dc-default-rtdb.asia-southeast1.firebasedatabase.app
FIREBASE_PROJECT_ID=kpitracker-8e8dc
FIREBASE_STORAGE_BUCKET=kpitracker-8e8dc.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=153764176296
FIREBASE_APP_ID=1:153764176296:web:047841097ab10244907d9d
FIREBASE_MEASUREMENT_ID=G-5Q5SXJS9QV
SERVICE_ACCOUNT_KEY_PATH=serviceAccountKey.json

# Session Settings
JWT_SECRET_KEY=your_jwt_secret_key_here

# SMTP settings (REQUIRED for user signup email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email@gmail.com
SMTP_USE_TLS=true
```

### 2. Frontend Config (`frontend/.env`)
Create a `.env` file inside the `frontend/` directory and paste the public web app Firebase keys:

```env
# Firebase web client settings (Exposed in the browser)
VITE_FIREBASE_API_KEY=AIzaSyBEf4W67vj28e-TGAHIFmKvjyYr1GrfTeY
VITE_FIREBASE_AUTH_DOMAIN=kpitracker-8e8dc.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://kpitracker-8e8dc-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=kpitracker-8e8dc
VITE_FIREBASE_STORAGE_BUCKET=kpitracker-8e8dc.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=153764176296
VITE_FIREBASE_APP_ID=1:153764176296:web:047841097ab10244907d9d
VITE_FIREBASE_MEASUREMENT_ID=G-5Q5SXJS9QV
```

---

## Step 3: Run the Backend Server

1. Open your terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create a Python virtual environment:
   ```bash
   python3 -m venv venv
   ```

3. Activate the virtual environment:
   * **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```
   * **Windows**:
     ```cmd
     .\venv\Scripts\activate
     ```

4. Install the Python backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Run the FastAPI server:
   ```bash
   python main.py
   ```
   The backend should start successfully and listen on `http://localhost:8000`. 


---

## Step 4: Run the Frontend Client

1. Open a new terminal window/tab and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install the Node.js packages:
   ```bash
   npm install
   ```

3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   Vite will launch the server and serve the client on `http://localhost:5173`. 
   Any requests to `/api/*` will automatically be forwarded to the backend on `http://localhost:8000` via the proxy.

---

## Step 5: CORS and Network Setup 

If you want to view/test the application from another device (like your phone or another PC on the same Wi-Fi network):

1. **Expose the Frontend Server**:
   Start the frontend with the `--host` flag to bind to all interfaces:
   ```bash
   npm run dev -- --host
   ```
   This will output a local network URL, e.g., `http://192.168.1.100:5173`.

2. **Backend Network Access & CORS**:
   If the frontend makes direct requests to the backend server's IP address (bypassing the dev proxy), you will need to add your local network IP to the `allow_origins` array in `backend/main.py`:
   ```python
   allow_origins=[
       "http://192.168.1.100:5173", # add your machine's local IP address
       "http://localhost:5173",
       "http://127.0.0.1:5173",
       ...
   ]
   ```
