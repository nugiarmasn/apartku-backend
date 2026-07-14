import hashlib
from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import MidtransWebhook
from app.core.firebase_init import db
from app.core.config import settings
from app.services.notification_service import NotificationService   # <-- tambahan import
from datetime import datetime

router = APIRouter()

@router.post("/midtrans")
async def midtrans_webhook(data: MidtransWebhook):
    signature_raw = f"{data.order_id}{data.status_code}{data.gross_amount}{settings.MIDTRANS_SERVER_KEY}"
    signature_check = hashlib.sha512(signature_raw.encode()).hexdigest()

    if data.signature_key != signature_check:
        raise HTTPException(status_code=403, detail="Invalid Signature Key")

    order_id = data.order_id
    status = data.transaction_status

    print(f"--- WEBHOOK RECEIVED: {order_id} | STATUS: {status} ---")

    bill_ref = db.collection("bills").document(order_id)

    if status == "settlement" or status == "capture":
        bill_ref.update({
            "status": "PAID",
            "paid_at": datetime.now().isoformat(),
            "payment_type": data.payment_type,
            "midtrans_id": data.transaction_id
        })
        print(f"SUCCESS: Tagihan {order_id} LUNAS.")

        # 🔔 KIRIM NOTIFIKASI PEMBAYARAN BERHASIL
        bill_data = bill_ref.get().to_dict()
        if bill_data:
            amount = bill_data.get("amount", 0)
            tenant_email = bill_data.get("tenant_email")
            if tenant_email:
                NotificationService.send(
                    user_email=tenant_email,
                    title="Pembayaran Berhasil",
                    desc=f"Terima kasih! Pembayaran {bill_data.get('title', 'tagihan')} sebesar Rp {amount:,.0f} telah kami terima.".replace(",", "."),
                    type="payment",
                )

    elif status == "pending":
        bill_ref.update({"status": "PENDING_PAYMENT"})

    elif status == "deny" or status == "cancel" or status == "expire":
        bill_ref.update({"status": "FAILED/EXPIRED"})
        print(f"FAILED: Tagihan {order_id} Gagal.")

    return {"message": "Webhook processed successfully"}