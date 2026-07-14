import midtransclient
import os
from dotenv import load_dotenv

# Muat variabel dari file .env
load_dotenv()

server_key = os.getenv("MIDTRANS_SERVER_KEY")
is_prod = os.getenv("MIDTRANS_IS_PRODUCTION") == "True"

class PaymentService:
    # Inisialisasi Snap
    snap = midtransclient.Snap(
        is_production=is_prod,
        server_key=server_key
    )

    # Inisialisasi Core API 
    core = midtransclient.CoreApi(
        is_production=is_prod,
        server_key=server_key
    )

    # 1. KEMBALIKAN KE SEMULA (Fungsi lama untuk Owner menggunakan Snap & mengembalikan String)
    @classmethod
    def create_qris_transaction(cls, order_id: str, amount: int, user_email: str, user_name: str):
        param = {
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": int(amount)
            },
            "customer_details": {
                "first_name": user_name,
                "email": user_email
            },
            # 👇 BARIS "enabled_payments" DIHAPUS SAJA 👇
            "usage_limit": 1 
        }
        try:
            transaction = cls.snap.create_transaction(param)
            return transaction['redirect_url'] # Mengembalikan String murni agar fitur owner tidak rusak
        except Exception as e:
            print(f"Midtrans API Error: {e}")
            return None

    # 2. FUNGSI BARU KHUSUS TENANT (Menggunakan Core API & mengembalikan Dict untuk QRIS Native)
    @classmethod
    def create_native_qris(cls, order_id: str, amount: int, user_email: str, user_name: str, unit_no: str = "-", period: str = "-"):
        param = {
            "payment_type": "gopay",
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": int(amount) 
            },
            "customer_details": {
                "first_name": user_name,
                "email": user_email
            },
            "item_details": [
                {
                    "id": f"BILL-{order_id}",
                    "price": int(amount),
                    "quantity": 1,
                    "name": f"Tagihan Unit {unit_no} - {period}"
                }
            ]
        }
        try:
            response = cls.core.charge(param)
            qr_url = None
            if 'actions' in response:
                for action in response['actions']:
                    if action['name'] == 'generate-qr-code':
                        qr_url = action['url']
                        break
            if qr_url:
                return {"status": "success", "qr_url": qr_url}
            else:
                return {"status": "error", "message": "Gagal men-generate QR Code dari Midtrans."}
        except Exception as e:
            print(f"Midtrans Core API Error: {e}")
            return {"status": "error", "message": str(e)}