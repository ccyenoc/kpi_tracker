"""
Secure Firebase Configuration for Backend and Frontend
"""
import os
from dotenv import load_dotenv

# Always load backend/.env regardless of current working directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=ENV_PATH)

# Load from environment variables (must be set in .env file)
FIREBASE_CONFIG = {
    "apiKey": os.getenv("FIREBASE_API_KEY"),
    "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN"),
    "databaseURL": os.getenv("FIREBASE_DATABASE_URL"),
    "projectId": os.getenv("FIREBASE_PROJECT_ID"),
    "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET"),
    "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID"),
    "appId": os.getenv("FIREBASE_APP_ID"),
    "measurementId": os.getenv("FIREBASE_MEASUREMENT_ID")

}

FIREBASE_ADMIN_CONFIG = {
    "projectId": FIREBASE_CONFIG.get("projectId"),
    "databaseURL": FIREBASE_CONFIG.get("databaseURL"),
    "storageBucket": FIREBASE_CONFIG.get("storageBucket")
}

SERVICE_ACCOUNT_KEY_PATH = os.getenv("SERVICE_ACCOUNT_KEY_PATH", "serviceAccountKey.json")

USERDATA_COLLECTION = os.getenv("USERDATA_COLLECTION", "userData")
USERAUTH_COLLECTION = os.getenv("USERAUTH_COLLECTION", "userAuth")

KPI_COLLECTION = os.getenv("KPI_COLLECTION", "kpiData")


# Counter collection/doc used to allocate sequential user IDs (user_101, user_102...)
USER_COUNTER_COLLECTION = os.getenv("USER_COUNTER_COLLECTION", "systemCounters")
USER_COUNTER_DOC = os.getenv("USER_COUNTER_DOC", "userIdCounter")

USER_ROLES = {
    "STAFF": "staff",
    "MANAGER": "manager",
    "ADMIN": "admin"
}

def validate_firebase_config():
    required = [
        "FIREBASE_API_KEY",
        "FIREBASE_AUTH_DOMAIN",
        "FIREBASE_DATABASE_URL",
        "FIREBASE_PROJECT_ID",
    ]
    missing = [v for v in required if not os.getenv(v)]
    if missing:
        # Not fatal; we have defaults, so just warn
        return False
    return True


def print_config_status():
    print("=== Firebase Configuration Status ===")
    print(f"Project ID: {FIREBASE_CONFIG.get('projectId')}")
    print(f"Auth Domain: {FIREBASE_CONFIG.get('authDomain')}")
    print(f"Database URL: {FIREBASE_CONFIG.get('databaseURL')}")
    print(f"Storage Bucket: {FIREBASE_CONFIG.get('storageBucket')}")
    print(f"Service Account Key: {SERVICE_ACCOUNT_KEY_PATH}")
    print("=========================================")
