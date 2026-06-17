import os
import sys
import time
import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient


# ==========================================================
# Make sure the backend folder can be imported during tests
# ==========================================================

backend_dir = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)



# ==========================================================
# Create a fake Firestore database
# ==========================================================
#
# Instead of talking to a real Firestore database,
# all database calls during tests will use this mock.
#
# Example:
#
# db.collection("userData")
#
# actually becomes:
#
# mock_db.collection("userData")
"""
Collection
    ↓ document("123")
Document Reference
    ↓ get()
Document Snapshot
    ↓ to_dict()
Actual Data
"""
#
# ==========================================================

mock_db = MagicMock()

# Stores fake collections that have already been created
mock_collections = {}


def default_collection_router(collection_name):

    # Reuse existing collection if already created
    if collection_name in mock_collections:
        return mock_collections[collection_name]

    # if there is no found of the collection in mokc collections dictionary , it will create a mock collection
    col = MagicMock()

    # Store collection name for debugging
    col._name = collection_name


    data = {}

    #defining a fake data for each collection
    if collection_name == "userData":
        data = {
            "name": "Jane User",
            "email": "user@company.com",
            "role": "manager",
            "department": "Engineering"
        }

    elif collection_name == "kpiData":
        data = {
            "title": "Default KPI Target",
            "description": "Default Description",
            "target": 100.0,
            "status": "active",
            "kpiAssignments": []
        }

    elif collection_name == "sessions":
        data = {
            "jti": "mock_jti",
            "user_id": "user_101",
            "expiresAt": int(time.time()) + 3600,
            "revoked": False
        }

    elif collection_name == "emailVerifications":
        data = {
            "email": "john@company.com",
            "codeHash": "matching_hash",
            "codeSalt": "salt123",
            "expiresAt": int(time.time()) + 600,
            "verified": False
        }

    # ======================================================
    # Fake document handling
    # ======================================================
    #
    # Simulates:
    #
    # db.collection("userData").document("abc")
    #
    # ======================================================

    doc_refs = {}

    def document_router(doc_id=None):

        # Handles document() without an ID
        #
        # Example:
        # db.collection("userData").document()
        #
        if doc_id is None:

            # Prevent infinite recursion
            col.document.side_effect = None

            ret = col.document.return_value

            # Restore routing function
            col.document.side_effect = document_router

            return ret

        # Return same document if already created
        if doc_id in doc_refs:
            return doc_refs[doc_id]

        # ==========================================
        # Create fake document reference
        # ==========================================

        doc_ref = MagicMock()
        doc_ref.id = doc_id

        # ==========================================
        # Create fake document snapshot
        # ==========================================
        #
        # Equivalent to:
        #
        # snapshot = doc_ref.get()
        #
        # ==========================================

        doc_snapshot = MagicMock()

        # Pretend document exists
        doc_snapshot.exists = True

        doc_snapshot.id = doc_id

        # Pretend Firestore returned data
        doc_snapshot.to_dict.return_value = data

        # When .get() is called, return snapshot
        doc_ref.get.return_value = doc_snapshot

        doc_refs[doc_id] = doc_ref

        return doc_ref

    # Replace document() with our router
    col.document.side_effect = document_router

    # ======================================================
    # Fake query support
    # ======================================================
    #
    # Allows code like:
    #
    # db.collection("userData")
    #   .where(...)
    #   .where(...)
    #
    # Since Firestore returns another query object,
    # we simply return the collection itself.
    #
    # ======================================================

    col.where.return_value = col

    # ======================================================
    # Fake stream()
    # ======================================================
    #
    # stream() normally returns many documents.
    #
    # Here we return a list with one fake document.
    #
    # ======================================================

    default_doc_ref = col.document("mock_doc_id")

    col.stream.return_value = [
        default_doc_ref.get()
    ]

    # Save collection for reuse
    mock_collections[collection_name] = col

    return col


# ==========================================================
# Redirect collection() calls to our router
# ==========================================================
#
# db.collection("userData")
#
# becomes:
#
# default_collection_router("userData")
#
# ==========================================================

mock_db.collection.side_effect = default_collection_router


# ==========================================================
# Mock Firebase Admin SDK
# ==========================================================
#
# Prevents tests from:
# - Connecting to Firebase
# - Reading service account files
# - Making network requests
#
# ==========================================================

mock_firebase_admin = MagicMock()

mock_credentials = MagicMock()

mock_firestore = MagicMock()

# firestore.client() returns our fake database
mock_firestore.client = MagicMock(return_value=mock_db)

mock_firebase_admin.firestore = mock_firestore


# ==========================================================
# Replace Firebase modules globally
# ==========================================================
#
# Any import like:
#
# import firebase_admin
#
# receives our fake version.
#
# ==========================================================

sys.modules['firebase_admin'] = mock_firebase_admin
sys.modules['firebase_admin.credentials'] = mock_credentials
sys.modules['firebase_admin.firestore'] = mock_firestore


# ==========================================================
# Replace config.firebase_config
# ==========================================================
#
# Real application:
#
# from config.firebase_config import db
#
# Test application:
#
# db = mock_db
#
# ==========================================================

mock_config_module = MagicMock()

mock_config_module.db = mock_db

sys.modules['config.firebase_config'] = mock_config_module


# ==========================================================
# Mock JWT verification
# ==========================================================
#
# Instead of validating real JWT signatures,
# always return a fake authenticated user.
#
# ==========================================================

import utils.security

# Keep original in case needed later
utils.security.original_verify_jwt_token = (
    utils.security.verify_jwt_token
)

mock_verify_token = MagicMock()

# Default authenticated user
mock_verify_token.return_value = {
    "user_id": "manager_123",
    "email": "manager@company.com"
}

# Replace real JWT verification function
utils.security.verify_jwt_token = mock_verify_token


# ==========================================================
# Auto-clean fixture
# ==========================================================
#
# Runs BEFORE every test automatically.
#
# Purpose:
# - clear old mock call history
# - reset collections
# - reset JWT behavior
#
# ==========================================================

@pytest.fixture(autouse=True)
def clean_mock_db():

    # Clear call history
    mock_db.reset_mock()

    # Remove previously created collections
    mock_collections.clear()

    # Restore collection router
    mock_db.collection.side_effect = default_collection_router

    # Reset JWT mock
    mock_verify_token.reset_mock()

    # Default successful authentication
    mock_verify_token.return_value = {
        "user_id": "manager_123",
        "email": "manager@company.com"
    }

    mock_verify_token.side_effect = None

    yield


# ==========================================================
# FastAPI test client
# ==========================================================
#
# Allows:
#
# response = client.get("/users")
#
# without running a real server.
#
# ==========================================================

@pytest.fixture
def client():
    from main import app
    return TestClient(app)


# ==========================================================
# Database mock fixture
# ==========================================================
#
# Allows tests to directly manipulate mock_db.
#
# ==========================================================

@pytest.fixture
def db_mock():
    return mock_db


# ==========================================================
# JWT mock fixture
# ==========================================================
#
# Allows tests to change authentication behavior.
#
# Example:
#
# jwt_mock.side_effect = Exception("Invalid token")
#
# ==========================================================

@pytest.fixture
def jwt_mock():
    return mock_verify_token