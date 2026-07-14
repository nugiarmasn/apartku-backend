import face_recognition
import io

class FaceMatchingService:
    @staticmethod
    async def compare_ktp_vs_selfie(ktp_file, selfie_file):
        try:
            # 1. Baca file binary
            ktp_bytes = await ktp_file.read()
            selfie_bytes = await selfie_file.read()

            # 2. Load ke face_recognition
            ktp_image = face_recognition.load_image_file(io.BytesIO(ktp_bytes))
            selfie_image = face_recognition.load_image_file(io.BytesIO(selfie_bytes))

            # 3. Ambil Encoding (Wajah)
            ktp_enc = face_recognition.face_encodings(ktp_image)
            selfie_enc = face_recognition.face_encodings(selfie_image)

            if not ktp_enc or not selfie_enc:
                return {"status": "error", "message": "Wajah tidak terdeteksi"}

            # 4. Hitung Jarak (Distance)
            # Semakin kecil angka distance, semakin mirip.
            distance = face_recognition.face_distance([ktp_enc[0]], selfie_enc[0])[0]
            
            # Threshold 0.4 (Standar keamanan tinggi)
            is_match = bool(distance <= 0.4)
            confidence = round((1 - distance) * 100, 2)

            return {
                "status": "success",
                "is_match": is_match,
                "confidence": confidence
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}