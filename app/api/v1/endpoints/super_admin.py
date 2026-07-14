from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.face_matching_service import FaceMatchingService
from app.core.firebase_init import db

router = APIRouter()

@router.post("/verify-user/{user_id}")
async def verify_user(user_id: str, ktp: UploadFile = File(...), selfie: UploadFile = File(...)):
    # 1. Panggil Service AI
    result = await FaceMatchingService.compare_ktp_vs_selfie(ktp, selfie)
    
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])

    # 2. Update Firestore jika Match
    if result["is_match"]:
        # Update field di koleksi 'users'
        user_ref = db.collection("users").document(user_id)
        user_ref.update({
            "is_verified": True,
            "kyc_score": result["confidence"],
            "status": "active"
        })
        
        return {
            "status": "verified",
            "message": f"User {user_id} berhasil diverifikasi!",
            "confidence": f"{result['confidence']}%"
        }
    else:
        return {
            "status": "rejected",
            "message": "Wajah tidak cocok, verifikasi ditolak!",
            "confidence": f"{result['confidence']}%"
        }