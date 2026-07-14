# app/services/notification_service.py
from app.core.firebase_init import db
from firebase_admin import firestore

class NotificationService:
    @classmethod
    def send(cls, user_email: str, title: str, desc: str, type: str):
        """
        type: 'tagihan' | 'approval' | 'payment' | 'complaint'
        """
        try:
            db.collection("notifications").add({
                "userEmail": user_email,
                "title": title,
                "desc": desc,
                "type": type,
                "isRead": False,
                "createdAt": firestore.SERVER_TIMESTAMP,
            })
        except Exception as e:
            print(f"ERROR kirim notifikasi: {e}")