import os
import sys
import time
from unittest.mock import MagicMock

# Ensure backend directory is in the import path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Create a shared mock firestore client
mock_db = MagicMock()
mock_collections = {}

# Setup default collection routing to avoid conflicts in tests
def default_collection_router(collection_name):
    if collection_name in mock_collections:
        return mock_collections[collection_name]
        
    col = MagicMock()
    col._name = collection_name
    
    # Sensible defaults for each collection
    data = {}
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

    # Document routing mock
    doc_refs = {}
    def document_router(doc_id=None):
        if doc_id is None:
            col.document.side_effect = None
            ret = col.document.return_value
            col.document.side_effect = document_router
            return ret
        if doc_id in doc_refs:
            return doc_refs[doc_id]
            
        doc_ref = MagicMock()
        doc_ref.id = doc_id
        
        doc_snapshot = MagicMock()
        doc_snapshot.exists = True
        doc_snapshot.id = doc_id
        doc_snapshot.to_dict.return_value = data
        
        doc_ref.get.return_value = doc_snapshot
        doc_refs[doc_id] = doc_ref
        return doc_ref
        
    col.document.side_effect = document_router
    
    # Mock query/stream behavior
    col.where.return_value = col
    
    default_doc_ref = col.document("mock_doc_id")
    col.stream.return_value = [default_doc_ref.get()]
    
    mock_collections[collection_name] = col
    return col

mock_db.collection.side_effect = default_collection_router

# Mock firebase_admin modules to avoid real network calls or file reads
mock_firebase_admin = MagicMock()
mock_credentials = MagicMock()
mock_firestore = MagicMock()
mock_firestore.client = MagicMock(return_value=mock_db)
mock_firebase_admin.firestore = mock_firestore

sys.modules['firebase_admin'] = mock_firebase_admin
sys.modules['firebase_admin.credentials'] = mock_credentials
sys.modules['firebase_admin.firestore'] = mock_firestore

# Mock the database config module
mock_config_module = MagicMock()
mock_config_module.db = mock_db
sys.modules['config.firebase_config'] = mock_config_module

# Globally patch verify_jwt_token at the utils.security module level
import utils.security
utils.security.original_verify_jwt_token = utils.security.verify_jwt_token
mock_verify_token = MagicMock()
mock_verify_token.return_value = {
    "user_id": "manager_123",
    "email": "manager@company.com"
}
utils.security.verify_jwt_token = mock_verify_token


import pytest
from fastapi.testclient import TestClient

@pytest.fixture(autouse=True)
def clean_mock_db():
    mock_db.reset_mock()
    mock_collections.clear()
    mock_db.collection.side_effect = default_collection_router
    mock_verify_token.reset_mock()
    mock_verify_token.return_value = {
        "user_id": "manager_123",
        "email": "manager@company.com"
    }
    mock_verify_token.side_effect = None
    yield

@pytest.fixture
def client():
    # Only import main after sys.modules mocks are applied
    from main import app
    return TestClient(app)

@pytest.fixture
def db_mock():
    return mock_db

@pytest.fixture
def jwt_mock():
    return mock_verify_token
