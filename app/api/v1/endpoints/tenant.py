from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.firebase_init import db
from firebase_admin import firestore
import time

# Import Schema Baru dan PaymentService
from app.models.schemas import ComplaintCreate, QrisPaymentRequest
from app.services.payment_service import PaymentService

router = APIRouter()

@router.post("/send-complaint")
async def send_complaint(data: ComplaintCreate):
    try:
        complaint_data = {
            "tenantEmail": data.tenant_email,
            "ownerEmail": data.owner_email,
            "unitNo": data.unit_no,
            "title": data.title,
            "description": data.description,
            "category": data.category,
            "photoUrl": data.photo_base64, 
            "status": "pending",
            "createdAt": firestore.SERVER_TIMESTAMP 
        }
        
        db.collection("complaints").add(complaint_data)
        return {"status": "success", "message": "Laporan terkirim!"}
    except Exception as e:
        print(f"ERROR BACKEND: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ENDPOINT KHUSUS UNTUK GENERATE QRIS (Core API) DARI FLUTTER
@router.post("/pay-qris")
async def pay_qris(data: QrisPaymentRequest):
    # PERBAIKAN: Memanggil fungsi khusus 'create_native_qris'
    result = PaymentService.create_native_qris(
        order_id=data.order_id,
        amount=data.amount,
        user_email=data.user_email,
        user_name=data.user_name,
        unit_no=data.unit_no,
        period=data.period
    )
    
    if result["status"] == "success":
        return {
            "status": "success",
            "qr_url": result["qr_url"]
        }
    else:
        raise HTTPException(status_code=500, detail=result["message"])