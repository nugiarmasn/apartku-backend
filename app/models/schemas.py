from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ================================================
# SCHEMA UNTUK AUTH & USER
# ================================================

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str  # 'super_admin', 'owner', 'tenant'

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str = ""
    role: str = "tenant"
    ktp_base64: str = ""   
    face_base64: str = ""  

class FaceMatchRequest(BaseModel):
    user_id: str
    image_base64: str  

# ================================================
# SCHEMA UNTUK TAGIHAN (BILLING)
# ================================================

class BillCreate(BaseModel):
    unit_id: str
    amount: int
    due_date: str
    description: str

# Tambahan Baru: Schema Request untuk QRIS Core API
class QrisPaymentRequest(BaseModel):
    order_id: str
    amount: int
    user_email: str
    user_name: str
    unit_no: str
    period: str

# ================================================
# SCHEMA UNTUK KELUHAN (COMPLAINT) — DIUBAH
# ================================================

class ComplaintCreate(BaseModel):
    tenant_email: str
    owner_email: str
    unit_no: str
    title: str
    description: str
    category: str = "Umum"
    photo_base64: Optional[str] = None

# ================================================
# SCHEMA UNTUK MIDTRANS WEBHOOK
# ================================================

class MidtransWebhook(BaseModel):
    transaction_time: str
    transaction_status: str
    transaction_id: str
    status_message: str
    status_code: str
    signature_key: str
    payment_type: str
    order_id: str
    merchant_id: str
    gross_amount: str
    currency: str
    settlement_time: Optional[str] = None
    expiry_time: Optional[str] = None