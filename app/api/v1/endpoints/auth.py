import random
import time
from fastapi import APIRouter, HTTPException, BackgroundTasks, File, UploadFile, Form
from pydantic import BaseModel, EmailStr
from app.services.mail_service import send_otp_email
from app.core.firebase_init import db
from app.models.schemas import UserCreate
from app.core.security import hash_password, verify_password   # ✅ TAMBAHAN IMPORT
from io import BytesIO
from PIL import Image

router = APIRouter()

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

# 🆕 SKEMA UNTUK CHANGE PASSWORD
class ChangePasswordRequest(BaseModel):
    email: EmailStr
    current_password: str
    new_password: str

# ========== ENDPOINT SEND OTP (TIDAK DIUBAH) ==========
@router.post("/send-otp")
async def send_otp(request: OTPRequest, background_tasks: BackgroundTasks):
    otp = str(random.randint(100000, 999999))
    expiry = time.time() + 300
    
    try:
        db.collection("otp_codes").document(request.email).set({
            "otp": otp,
            "expiry": expiry
        })
        
        background_tasks.add_task(send_otp_email, request.email, otp)
        
        return {"status": "success", "message": "OTP terkirim ke email"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== ENDPOINT VERIFY OTP (TIDAK DIUBAH) ==========
@router.post("/verify-otp")
async def verify_otp(request: OTPVerify):
    try:
        otp_ref = db.collection("otp_codes").document(request.email).get()
        
        if not otp_ref.exists:
            raise HTTPException(status_code=400, detail="OTP tidak ditemukan atau sudah kadaluarsa")
            
        data = otp_ref.to_dict()
        
        if time.time() > data['expiry']:
            db.collection("otp_codes").document(request.email).delete()
            raise HTTPException(status_code=400, detail="OTP sudah kadaluarsa")
            
        if data['otp'] != request.otp:
            raise HTTPException(status_code=400, detail="Kode OTP salah")
            
        db.collection("otp_codes").document(request.email).delete()
        
        admin_ref = db.collection("admins").document(request.email).get()
        if admin_ref.exists:
            return {"status": "success", "role": "super_admin"}
        
        owner_ref = db.collection("owners").document(request.email).get()
        if owner_ref.exists:
            return {"status": "success", "role": "owner"}
        
        tenant_ref = db.collection("users").document(request.email).get()
        if tenant_ref.exists:
            return {"status": "success", "role": "tenant"}
        
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== ENDPOINT REGISTER (DIUBAH – TAMBAH PASSWORD_HASH) ==========
@router.post("/register")
async def register_tenant(user: UserCreate):
    try:
        user_ref = db.collection("users").document(user.email).get()
        if user_ref.exists:
            raise HTTPException(status_code=400, detail="Email sudah terdaftar")

        db.collection("users").document(user.email).set({
            "full_name": user.full_name,
            "email": user.email,
            "role": "tenant",
            "phone": user.phone if hasattr(user, 'phone') else "",
            "ktp_base64": user.ktp_base64 if hasattr(user, 'ktp_base64') else "",
            "face_base64": user.face_base64 if hasattr(user, 'face_base64') else "",
            "status": "pending",
            "faceIdActive": False,
            "password_hash": hash_password(user.password),   # ✅ TAMBAHAN INI
            "created_at": time.time()
        })
        
        return {"status": "success", "message": "Tenant berhasil terdaftar"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== ENDPOINT VERIFY FACE (TIDAK DIUBAH) ==========
@router.post("/verify-face")
async def verify_face(email: str = Form(...), file: UploadFile = File(...)):
    print(f"--- TERIMA REQUEST FACE SCAN: {email} ---")
    try:
        contents = await file.read()
        image = Image.open(BytesIO(contents))
        print(f"✅ Gambar terbaca: {image.size}")
        return {
            "status": "success",
            "verified": True
        }
    except Exception as e:
        print(f"❌ Error Face Scan: {e}")
        raise HTTPException(status_code=400, detail="File bukan gambar valid")

# ========== ENDPOINT BARU: CHANGE PASSWORD ==========
@router.post("/change-password")
async def change_password(req: ChangePasswordRequest):
    try:
        # Cari user di 3 kemungkinan collection (tenant, owner, admin)
        collections_to_check = ["users", "owners", "admins"]
        user_doc_ref = None
        user_data = None

        for col in collections_to_check:
            ref = db.collection(col).document(req.email)
            snap = ref.get()
            if snap.exists:
                user_doc_ref = ref
                user_data = snap.to_dict()
                break

        if user_doc_ref is None:
            raise HTTPException(status_code=404, detail="User tidak ditemukan")

        stored_hash = user_data.get("password_hash")

        # Kalau user lama belum punya password_hash (data lama sebelum fitur ini ada),
        # izinkan set password pertama kali tanpa verifikasi password lama
        if stored_hash:
            if not verify_password(req.current_password, stored_hash):
                raise HTTPException(status_code=400, detail="Password saat ini salah")

        new_hash = hash_password(req.new_password)
        user_doc_ref.update({"password_hash": new_hash})

        return {"status": "success", "message": "Password berhasil diubah"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))