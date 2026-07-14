import firebase_admin
from firebase_admin import credentials, firestore, auth, messaging
import os
from dotenv import load_dotenv

load_dotenv()

# Path ke file json yang lo download dari Firebase
JSON_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json")

if not firebase_admin._apps:
    cred = credentials.Certificate(JSON_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()
# Sekarang kita bisa panggil 'db' dari mana saja untuk akses Firestore