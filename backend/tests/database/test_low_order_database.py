import sys
import os
import pytest


# Ensure backend directory is in the import path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
   sys.path.insert(0, backend_dir)


# Save conftest.py's global mock overrides so we can restore them later
@pytest.fixture(scope="module")
def db():
    saved_mocked_modules = {}
    mocked_modules = [
       'firebase_admin',
       'firebase_admin.credentials',
       'firebase_admin.firestore',
       'config',
       'config.firebase_config'
    ]
    for mod in mocked_modules:
       if mod in sys.modules:
           saved_mocked_modules[mod] = sys.modules[mod]
           del sys.modules[mod]

    # Import the real database client (which initializes firebase_admin using serviceAccountKey.json)
    from config.firebase_config import db as real_db

    yield real_db

    # Clean up real database from sys.modules
    for mod in mocked_modules:
        if mod in sys.modules:
            del sys.modules[mod]

    # Restore mock overrides for other unit/functional tests
    for mod, val in saved_mocked_modules.items():
        sys.modules[mod] = val




# Test document prefix to identify and clean up test data on the live Firestore
TEST_PREFIX = "pytest_"




# --------------------------------------------------
# DB-01: Verify Firestore Connection
# --------------------------------------------------
def test_firestore_connection(db):
   collections = list(db.collections())
   assert collections is not None




# --------------------------------------------------
# DB-02: Verify KPI Document Creation
# --------------------------------------------------
def test_create_kpi_document(db):
   doc_ref = db.collection("kpiData").document(
       f"{TEST_PREFIX}create_kpi"
   )


   try:
       doc_ref.set({
           "title": "Test KPI",
           "target": 100,
           "status": "active"
       })


       document = doc_ref.get()


       assert document.exists
       assert document.to_dict()["title"] == "Test KPI"
       assert document.to_dict()["target"] == 100
       assert document.to_dict()["status"] == "active"


   finally:
       doc_ref.delete()




# --------------------------------------------------
# DB-03: Verify KPI Document Retrieval
# --------------------------------------------------
def test_read_kpi_document(db):
   doc_ref = db.collection("kpiData").document(
       f"{TEST_PREFIX}read_kpi"
   )


   try:
       doc_ref.set({
           "title": "Sales KPI",
           "target": 200,
           "status": "active"
       })


       document = doc_ref.get()


       assert document.exists
       assert document.to_dict()["title"] == "Sales KPI"
       assert document.to_dict()["target"] == 200
       assert document.to_dict()["status"] == "active"


   finally:
       doc_ref.delete()




# --------------------------------------------------
# DB-04: Verify KPI Document Update
# --------------------------------------------------
def test_update_kpi_document(db):
   doc_ref = db.collection("kpiData").document(
       f"{TEST_PREFIX}update_kpi"
   )


   try:
       doc_ref.set({
           "title": "Update KPI",
           "target": 100
       })


       doc_ref.update({
           "target": 250
       })


       updated_document = doc_ref.get()


       assert updated_document.exists
       assert updated_document.to_dict()["target"] == 250


   finally:
       doc_ref.delete()




# --------------------------------------------------
# DB-05: Verify KPI Document Deletion
# --------------------------------------------------
def test_delete_kpi_document(db):
   doc_ref = db.collection("kpiData").document(
       f"{TEST_PREFIX}delete_kpi"
   )


   doc_ref.set({
       "title": "Delete Test KPI"
   })


   doc_ref.delete()


   deleted_document = doc_ref.get()


   assert deleted_document.exists is False




# --------------------------------------------------
# DB-06: Verify User Document Creation
# --------------------------------------------------
def test_create_user_document(db):
   doc_ref = db.collection("userData").document(
       f"{TEST_PREFIX}user"
   )


   try:
       doc_ref.set({
           "name": "John Doe",
           "email": "john@example.com",
           "role": "staff"
       })


       document = doc_ref.get()


       assert document.exists
       assert document.to_dict()["name"] == "John Doe"
       assert document.to_dict()["email"] == "john@example.com"
       assert document.to_dict()["role"] == "staff"


   finally:
       doc_ref.delete()




# --------------------------------------------------
# DB-07: Verify User Document Update
# --------------------------------------------------
def test_update_user_document(db):
   doc_ref = db.collection("userData").document(
       f"{TEST_PREFIX}update_user"
   )


   try:
       doc_ref.set({
           "name": "John Doe",
           "department": "Sales"
       })


       doc_ref.update({
           "department": "Marketing"
       })


       document = doc_ref.get()


       assert document.exists
       assert document.to_dict()["department"] == "Marketing"


   finally:
       doc_ref.delete()




# --------------------------------------------------
# DB-08: Verify Query Filtering
# --------------------------------------------------
def test_query_active_kpis(db):
   doc_ref = db.collection("kpiData").document(
       f"{TEST_PREFIX}query_kpi"
   )


   try:
       doc_ref.set({
           "title": "Query KPI",
           "status": "active"
       })


       results = (
           db.collection("kpiData")
           .where("status", "==", "active")
           .stream()
       )


       active_found = any(
           doc.id == f"{TEST_PREFIX}query_kpi"
           for doc in results
       )


       assert active_found is True


   finally:
       doc_ref.delete()



