#!/usr/bin/env python3
"""
Create a sample session document in Firestore under the `sessions` collection.

Run from repository root:

    python3 backend/scripts/create_sample_session.py --user user_101

Then open the Firebase console and look for the `sessions` collection.
"""
import argparse
import time
import uuid
import os
import sys

# Ensure repository root is on sys.path so `config` package imports work
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from config.firebase_config import db


def create_session(user_id: str, ttl_seconds: int = 24 * 3600):
    jti = str(uuid.uuid4())
    now = int(time.time())
    doc = {
        "jti": jti,
        "user_id": user_id,
        "createdAt": now,
        "expiresAt": now + ttl_seconds,
        "revoked": False,
    }
    ref = db.collection("sessions").document(jti)
    ref.set(doc)
    return jti


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--user", default="user_101", help="user id for the sample session")
    args = parser.parse_args()

    jti = create_session(args.user)
    print(f"Created sample session with jti: {jti}")
    print("Open the Firestore console and look for collection 'sessions' -> document with this jti.")


if __name__ == "__main__":
    main()
