import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel

class AIService:
    # 1. Inisialisasi Model (Singleton: Load cuma sekali pas aplikasi jalan)
    model_name = "indobenchmark/indobert-lite-base-p1"
    device = torch.device("cpu")

    print(f"--- Loading AI Model: {model_name} (CPU Mode) ---")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name).to(device)
    print("--- AI Model Loaded Successfully! ---")

    # Mapping Kategori dan Deskripsi untuk perbandingan makna (Semantic Similarity)
    # Tips: Semakin detail deskripsinya, semakin pinter AI-nya.
    category_descriptions = {
        "TEKNIS": "masalah perbaikan fasilitas lampu mati air bocor ac tidak dingin listrik padam keran rusak lift macet pintu rusak pipa bocor saluran air mampet stop kontak korslet",
        "KEBERSIHAN": "masalah sampah kotor bau tidak sedap kecoa lalat banyak debu lorong kotor kolam renang keruh taman berantakan sampah menumpuk saluran got mampet bau busuk",
        "KEAMANAN": "ada maling orang mencurigakan berkelahi kunci hilang ancaman bahaya orang asing masuk tanpa izin keributan berisik cctv kamera pengawas rusak mati tidak berfungsi portal gerbang rusak satpam petugas keamanan akses masuk pintu darurat alarm kebakaran sensor pintu rusak pencurian kehilangan barang",
        "KEUANGAN": "salah tagihan pembayaran sewa biaya admin deposit belum dikembalikan masalah qris midtrans bukti bayar ditolak tagihan dobel salah nominal biaya tambahan tidak jelas",
    }

    # Keyword eksplisit per kategori -- dicek duluan sebelum semantic similarity,
    # karena istilah teknis/loanword (misal "cctv") sering bikin cosine similarity
    # IndoBERT dasar (belum fine-tuned) salah arah.
    category_keywords = {
        "TEKNIS": [
            "lampu", "listrik", "mati lampu", "ac", "pendingin", "air bocor",
            "keran", "pipa", "lift", "pintu rusak", "korslet", "stop kontak",
            "saluran air", "genset",
        ],
        "KEBERSIHAN": [
            "sampah", "kotor", "bau", "kecoa", "lalat", "debu", "kolam renang",
            "taman", "got", "selokan",
        ],
        "KEAMANAN": [
            "cctv", "kamera", "maling", "satpam", "portal", "gerbang",
            "keamanan", "orang asing", "mencurigakan", "curi", "pencurian",
            "kehilangan", "berkelahi", "keributan", "alarm", "pintu darurat",
        ],
        "KEUANGAN": [
            "tagihan", "bayar", "pembayaran", "deposit", "qris", "midtrans",
            "sewa", "nominal", "biaya admin",
        ],
    }

    @classmethod
    def _get_embedding(cls, text: str):
        """Mengubah teks menjadi vector (embedding)"""
        inputs = cls.tokenizer(
            text,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=128
        ).to(cls.device)

        with torch.no_grad():
            outputs = cls.model(**inputs)

        # Ambil rata-rata vector (mean pooling) dan lepaskan dari memory (detach)
        return outputs.last_hidden_state.mean(dim=1).detach()

    @classmethod
    def _keyword_match(cls, text: str):
        """
        Cek keyword eksplisit dulu. Kalau ada yang cocok, kategori dengan
        jumlah keyword hit terbanyak yang dipilih. Return None kalau
        tidak ada satupun keyword yang cocok (biar fallback ke semantic).
        """
        lower_text = text.lower()
        scores = {}
        for category, keywords in cls.category_keywords.items():
            hits = sum(1 for kw in keywords if kw in lower_text)
            if hits > 0:
                scores[category] = hits

        if not scores:
            return None

        return max(scores, key=scores.get)

    @classmethod
    def classify_complaint(cls, user_text: str):
        """Fungsi utama untuk klasifikasi keluhan user"""
        try:
            # 1. Coba keyword matching dulu -- lebih presisi untuk istilah eksplisit
            keyword_result = cls._keyword_match(user_text)
            if keyword_result is not None:
                return keyword_result

            # 2. Kalau tidak ada keyword yang cocok, baru pakai semantic similarity
            user_embedding = cls._get_embedding(user_text)

            best_category = "LAINNYA"
            highest_similarity = -1.0

            for category, description in cls.category_descriptions.items():
                category_embedding = cls._get_embedding(description)
                similarity = F.cosine_similarity(user_embedding, category_embedding).item()

                if similarity > highest_similarity:
                    highest_similarity = similarity
                    best_category = category

            # 3. Threshold (Ambang Batas)
            # Kalau kemiripan di bawah 0.4, anggap keluhan umum/tidak spesifik
            if highest_similarity < 0.4:
                return "UMUM"

            return best_category

        except Exception as e:
            print(f"AI Error: {e}")
            return "UMUM"  # Fallback jika AI error