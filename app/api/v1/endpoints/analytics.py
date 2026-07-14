from fastapi import APIRouter, HTTPException
from app.services.youtube_service import YouTubeService

router = APIRouter()
yt_service = YouTubeService()

@router.get("/youtube")
async def get_youtube_insights(q: str = "apartemen indonesia"):
    """
    Endpoint khusus Dashboard Admin untuk ambil data real-time YouTube.
    """
    try:
        data = await yt_service.get_realtime_insights(query=q)
        
        # Hitung statistik ringkas untuk visualisasi Neo-Brutalism
        stats = {
            "total_comments": len(data),
            "sentiment_distribution": {
                "positif": len([d for d in data if d['sentiment'] == 'POSITIF']),
                "negatif": len([d for d in data if d['sentiment'] == 'NEGATIF']),
                "netral": len([d for d in data if d['sentiment'] == 'NETRAL']),
            },
            "top_categories": {
                "finansial": len([d for d in data if d['category'] == 'FINANSIAL']),
                "lokasi": len([d for d in data if d['category'] == 'LOKASI']),
                "fasilitas": len([d for d in data if d['category'] == 'FASILITAS']),
            }
        }
        
        return {
            "status": "success",
            "summary": stats,
            "raw_data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ✅ TAMBAHKAN ENDPOINT UNTUK AI KLASIFIKASI KOMPLAIN (DIPANGGIL FLUTTER)
@router.post("/classify-complaint")
async def classify_complaint(request: dict):
    """
    Endpoint untuk klasifikasi keluhan secara real-time dari Flutter.
    Menerima teks, mengembalikan kategori dan confidence.
    """
    text = request.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # 🔮 LOGIKA SEDERHANA: Deteksi kata kunci untuk demo
    # (Nanti bisa diganti dengan model Indobert yang sebenarnya)
    text_lower = text.lower()
    
    if any(word in text_lower for word in ["kunci", "pintu", "bocor", "rusak", "mati", "pecah", "air", "listrik"]):
        category = "TECHNICAL"
        confidence = 0.92
    elif any(word in text_lower for word in ["kotor", "sampah", "bau", "debu", "lalat"]):
        category = "CLEANLINESS"
        confidence = 0.88
    elif any(word in text_lower for word in ["maling", "curi", "cctv", "bobol", "takut"]):
        category = "SECURITY"
        confidence = 0.85
    else:
        category = "GENERAL"
        confidence = 0.75

    return {
        "status": "success",
        "category": category,
        "confidence": confidence
    }