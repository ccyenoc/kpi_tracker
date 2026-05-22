import os
import firebase_admin
from firebase_admin import credentials, firestore

# Get the path to serviceAccountKey.json in the backend directory
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cert_path = os.path.join(backend_dir, "serviceAccountKey.json")

cred = credentials.Certificate(cert_path)

firebase_admin.initialize_app(cred)

db = firestore.client()