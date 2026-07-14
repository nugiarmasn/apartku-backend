from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.services.payment_service import PaymentService
from app.services.notification_service import NotificationService
from app.core.firebase_init import db
import datetime
import uuid

router = APIRouter()

class MassBillingRequest(BaseModel):
    buildingId: str
    ownerEmail: str
    title: str
    amountElit: int
    amountStandar: int
    amountEko: int
    dueDate: str
    targetTenantIds: List[str]

class ApproveBookingRequest(BaseModel):
    booking_id: str

class ApproveRenewalRequest(BaseModel):
    renewal_id: str

# ========== HELPERS TANGGAL ==========

def _add_months(start_date: datetime.datetime, months: int) -> datetime.datetime:
    month = start_date.month - 1 + months
    year = start_date.year + month // 12
    month = month % 12 + 1
    day = min(start_date.day, 28)
    return start_date.replace(year=year, month=month, day=day)

def _add_days(start_date: datetime.datetime, days: int) -> datetime.datetime:
    return start_date + datetime.timedelta(days=days)

def _add_weeks(start_date: datetime.datetime, weeks: int) -> datetime.datetime:
    return start_date + datetime.timedelta(weeks=weeks)

# ========== ENDPOINT GENERATE MASS BILLING ==========

@router.post("/generate-mass-billing")
async def generate_mass_billing(req: MassBillingRequest):
    count = 0
    results = []

    print(f"--- MEMPROSES PENAGIHAN: {req.title} ---")
    print(f"Target IDs dari Web: {req.targetTenantIds}")

    building_ref = db.collection("buildings").document(req.buildingId).get()
    if not building_ref.exists:
        raise HTTPException(status_code=404, detail="Building tidak ditemukan!")

    building = building_ref.to_dict()
    building_tier = str(building.get('tier', 'Standar')).lower()
    print(f"DEBUG BUILDING TIER: '{building_tier}'")

    if building_tier == 'elit':
        amount_for_building = req.amountElit
    elif building_tier in ['ekonomis', 'eko']:
        amount_for_building = req.amountEko
    else:
        amount_for_building = req.amountStandar

    print(f"DEBUG AMOUNT UNTUK BUILDING INI: {amount_for_building}")

    for unit_id in req.targetTenantIds:
        unit_ref = db.collection("units").document(unit_id).get()
        if not unit_ref.exists:
            print(f"DEBUG: Unit ID {unit_id} GAK KETEMU di Firestore!")
            continue

        unit = unit_ref.to_dict()
        nomor_unit = unit.get('unitNo') or unit.get('no') or "000"

        booking_query = db.collection("bookings") \
            .where("unitId", "==", unit_id) \
            .where("status", "==", "approved") \
            .limit(1) \
            .get()

        if not booking_query:
            print(f"DEBUG: Tidak ada booking approved untuk unit {nomor_unit}, skip!")
            continue

        booking = booking_query[0].to_dict()
        email_tenant = booking.get('userEmail') or "no-email@mail.com"
        nama_tenant = booking.get('userName') or "Guest"

        print(f"DEBUG: Unit {nomor_unit} → Tenant: {nama_tenant} ({email_tenant}) → Amount: {amount_for_building}")

        order_id = f"INV-{uuid.uuid4().hex[:6].upper()}"

        payment_url = PaymentService.create_qris_transaction(
            order_id=order_id,
            amount=amount_for_building,
            user_email=email_tenant,
            user_name=nama_tenant
        )

        if payment_url:
            bill_data = {
                "bill_id": order_id,
                "unit_no": nomor_unit,
                "tenant_name": nama_tenant,
                "tenant_email": email_tenant,
                "amount": amount_for_building,
                "title": req.title,
                "due_date": req.dueDate,
                "payment_url": payment_url,
                "status": "UNPAID",
                "owner_email": req.ownerEmail,
                "created_at": datetime.datetime.now().isoformat()
            }

            db.collection("bills").document(order_id).set(bill_data)

            NotificationService.send(
                user_email=email_tenant,
                title="Tagihan Jatuh Tempo",
                desc=f"Tagihan {req.title} sebesar Rp {amount_for_building:,.0f} akan jatuh tempo pada {req.dueDate}. Segera lakukan pembayaran.".replace(",", "."),
                type="tagihan",
            )

            count += 1
            results.append(f"{nama_tenant} ({email_tenant})")
        else:
            print(f"DEBUG: Midtrans Gagal untuk unit {nomor_unit}")

    print(f"--- SELESAI: {count} Tagihan Berhasil ---")
    return {
        "status": "success",
        "total_sent": count,
        "details": results
    }

# ============================================================
# APPROVE BOOKING
# ============================================================

@router.post("/approve-booking")
async def approve_booking(req: ApproveBookingRequest):
    # 1. Ambil data booking dari Firestore
    booking_ref = db.collection("bookings").document(req.booking_id)
    booking_doc = booking_ref.get()

    if not booking_doc.exists:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan!")

    booking = booking_doc.to_dict()

    if booking.get("status") != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Booking sudah berstatus '{booking.get('status')}', tidak bisa di-approve lagi."
        )

    unit_id = booking.get("unitId")
    if not unit_id:
        raise HTTPException(status_code=400, detail="Data booking tidak valid: unitId kosong.")

    # Safety net — cek bentrok unit
    unit_snapshot = db.collection("units").document(unit_id).get()
    if unit_snapshot.exists:
        unit_current = unit_snapshot.to_dict()
        existing_lease_end = unit_current.get("leaseEnd")
        if unit_current.get("status") == "Occupied" and existing_lease_end:
            try:
                existing_end_dt = datetime.datetime.fromisoformat(existing_lease_end)
                if existing_end_dt > datetime.datetime.now():
                    raise HTTPException(
                        status_code=400,
                        detail=f"Unit masih disewa sampai {existing_end_dt.strftime('%Y-%m-%d')}. Tidak bisa approve booking baru."
                    )
            except ValueError:
                pass

    rental_type = booking.get("rentalType", "bulanan")
    duration_value = booking.get("durationValue") or booking.get("durationMonths") or 3
    lease_start = datetime.datetime.now()

    if rental_type == "bulanan":
        lease_end = _add_months(lease_start, duration_value)
    elif rental_type == "harian":
        lease_end = _add_days(lease_start, duration_value)
    elif rental_type == "mingguan":
        lease_end = _add_weeks(lease_start, duration_value)
    else:
        raise HTTPException(status_code=400, detail=f"rentalType '{rental_type}' tidak dikenali.")

    # Update units
    db.collection("units").document(unit_id).update({
        "status": "Occupied",
        "tenantName": booking.get("userName", ""),
        "tenant_email": booking.get("userEmail", ""),
        "tenantEmail": booking.get("userEmail", ""),
        "unitNo": booking.get("unitNo", ""),
        "tier": booking.get("tier", ""),
        "price": booking.get("price", 0),
        "leaseStart": lease_start.isoformat(),
        "leaseEnd": lease_end.isoformat(),
        "rentalType": rental_type,
        "durationValue": duration_value,
        "durationMonths": booking.get("durationMonths", 0),
        "ktpUrl": booking.get("ktpUrl", ""),
        "selfieUrl": booking.get("selfieUrl", ""),
    })

    booking_ref.update({"status": "approved"})

    # Generate bills
    bills_created = 0
    if rental_type == "bulanan":
        for i in range(duration_value):
            due_date = _add_months(lease_start, i)
            order_id = f"INV-{uuid.uuid4().hex[:6].upper()}"
            payment_url = PaymentService.create_qris_transaction(
                order_id=order_id,
                amount=booking.get("price", 0),
                user_email=booking.get("userEmail", ""),
                user_name=booking.get("userName", ""),
            )
            if not payment_url:
                print(f"DEBUG: Midtrans gagal generate bill bulan ke-{i + 1} untuk booking {req.booking_id}")
                continue

            db.collection("bills").document(order_id).set({
                "bill_id": order_id,
                "tenant_email": booking.get("userEmail", ""),
                "tenant_name": booking.get("userName", ""),
                "owner_email": booking.get("ownerEmail", ""),
                "unit_no": booking.get("unitNo", ""),
                "title": f"Sewa Bulan {i + 1}",
                "amount": booking.get("price", 0),
                "status": "UNPAID",
                "due_date": due_date.strftime("%Y-%m-%d"),
                "payment_url": payment_url,
                "created_at": datetime.datetime.now().isoformat(),
            })
            bills_created += 1
    else:
        total_amount = booking.get("price", 0) * duration_value
        order_id = f"INV-{uuid.uuid4().hex[:6].upper()}"
        payment_url = PaymentService.create_qris_transaction(
            order_id=order_id,
            amount=total_amount,
            user_email=booking.get("userEmail", ""),
            user_name=booking.get("userName", ""),
        )
        if payment_url:
            label = "Hari" if rental_type == "harian" else "Minggu"
            db.collection("bills").document(order_id).set({
                "bill_id": order_id,
                "tenant_email": booking.get("userEmail", ""),
                "tenant_name": booking.get("userName", ""),
                "owner_email": booking.get("ownerEmail", ""),
                "unit_no": booking.get("unitNo", ""),
                "title": f"Sewa {duration_value} {label}",
                "amount": total_amount,
                "status": "UNPAID",
                "due_date": lease_start.strftime("%Y-%m-%d"),
                "payment_url": payment_url,
                "created_at": datetime.datetime.now().isoformat(),
            })
            bills_created = 1
        else:
            print(f"DEBUG: Midtrans gagal generate bill {rental_type} untuk booking {req.booking_id}")

    # Notifikasi
    NotificationService.send(
        user_email=booking.get("userEmail", ""),
        title="Persetujuan Unit",
        desc=f"Pengajuan sewa unit #{booking.get('unitNo', '-')} telah disetujui. {bills_created} tagihan telah dibuat.",
        type="approval",
    )

    return {
        "status": "success",
        "rental_type": rental_type,
        "duration_value": duration_value,
        "bills_created": bills_created,
        "lease_start": lease_start.isoformat(),
        "lease_end": lease_end.isoformat(),
    }


# ============================================================
# APPROVE RENEWAL (PERPANJANGAN KONTRAK)
# ============================================================

@router.post("/approve-renewal")
async def approve_renewal(req: ApproveRenewalRequest):
    # 1. Ambil data renewal request
    renewal_ref = db.collection("renewal_requests").document(req.renewal_id)
    renewal_doc = renewal_ref.get()

    if not renewal_doc.exists:
        raise HTTPException(status_code=404, detail="Pengajuan perpanjangan tidak ditemukan!")

    renewal = renewal_doc.to_dict()

    if renewal.get("status") != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Pengajuan sudah berstatus '{renewal.get('status')}', tidak bisa di-approve lagi."
        )

    unit_id = renewal.get("unitId")
    if not unit_id:
        raise HTTPException(status_code=400, detail="Data renewal tidak valid: unitId kosong.")

    unit_snapshot = db.collection("units").document(unit_id).get()
    if not unit_snapshot.exists:
        raise HTTPException(status_code=404, detail="Unit tidak ditemukan!")

    unit = unit_snapshot.to_dict()

    # Hitung lease_end baru (extend dari leaseEnd sekarang)
    rental_type = renewal.get("rentalType", "bulanan")
    duration_value = renewal.get("requestedDuration", 1)

    current_lease_end_str = renewal.get("currentLeaseEnd") or unit.get("leaseEnd")
    try:
        base_date = datetime.datetime.fromisoformat(current_lease_end_str) if current_lease_end_str else datetime.datetime.now()
    except ValueError:
        base_date = datetime.datetime.now()

    # Kalau kontrak lama udah lewat, extend dari sekarang aja (bukan dari tanggal lampau)
    if base_date < datetime.datetime.now():
        base_date = datetime.datetime.now()

    if rental_type == "bulanan":
        new_lease_end = _add_months(base_date, duration_value)
        price_field = "price"
    elif rental_type == "harian":
        new_lease_end = _add_days(base_date, duration_value)
        price_field = "priceDaily"
    elif rental_type == "mingguan":
        new_lease_end = _add_weeks(base_date, duration_value)
        price_field = "priceWeekly"
    else:
        raise HTTPException(status_code=400, detail=f"rentalType '{rental_type}' tidak dikenali.")

    unit_price = unit.get(price_field, 0)
    if not unit_price or unit_price <= 0:
        raise HTTPException(status_code=400, detail=f"Harga untuk tipe sewa '{rental_type}' belum diset di unit ini.")

    # 2. UPDATE leaseEnd di units
    db.collection("units").document(unit_id).update({
        "leaseEnd": new_lease_end.isoformat(),
        "rentalType": rental_type,
    })

    # 3. UPDATE status renewal_requests
    renewal_ref.update({
        "status": "approved",
        "approvedAt": datetime.datetime.now().isoformat(),
        "newLeaseEnd": new_lease_end.isoformat(),
    })

    # ========== 4. GENERATE TAGIHAN (sama pola kayak approve_booking) ==========
    bills_created = 0
    tenant_email = renewal.get("tenantEmail", "")
    tenant_name = renewal.get("tenantName", "")
    owner_email = renewal.get("ownerEmail", "")
    unit_no = renewal.get("unitNo", "")

    if rental_type == "bulanan":
        for i in range(duration_value):
            due_date = _add_months(base_date, i)
            order_id = f"INV-{uuid.uuid4().hex[:6].upper()}"
            payment_url = PaymentService.create_qris_transaction(
                order_id=order_id,
                amount=unit_price,
                user_email=tenant_email,
                user_name=tenant_name,
            )
            if not payment_url:
                print(f"DEBUG: Midtrans gagal generate bill perpanjangan bulan ke-{i + 1}")
                continue

            db.collection("bills").document(order_id).set({
                "bill_id": order_id,
                "tenant_email": tenant_email,
                "tenant_name": tenant_name,
                "owner_email": owner_email,
                "unit_no": unit_no,
                "title": f"Perpanjangan Sewa Bulan {i + 1}",
                "amount": unit_price,
                "status": "UNPAID",
                "due_date": due_date.strftime("%Y-%m-%d"),
                "payment_url": payment_url,
                "created_at": datetime.datetime.now().isoformat(),
            })
            bills_created += 1
    else:
        total_amount = unit_price * duration_value
        order_id = f"INV-{uuid.uuid4().hex[:6].upper()}"
        payment_url = PaymentService.create_qris_transaction(
            order_id=order_id,
            amount=total_amount,
            user_email=tenant_email,
            user_name=tenant_name,
        )
        if payment_url:
            label = "Hari" if rental_type == "harian" else "Minggu"
            db.collection("bills").document(order_id).set({
                "bill_id": order_id,
                "tenant_email": tenant_email,
                "tenant_name": tenant_name,
                "owner_email": owner_email,
                "unit_no": unit_no,
                "title": f"Perpanjangan Sewa {duration_value} {label}",
                "amount": total_amount,
                "status": "UNPAID",
                "due_date": base_date.strftime("%Y-%m-%d"),
                "payment_url": payment_url,
                "created_at": datetime.datetime.now().isoformat(),
            })
            bills_created = 1
        else:
            print(f"DEBUG: Midtrans gagal generate bill perpanjangan {rental_type}")

    # 5. NOTIFIKASI KE TENANT
    NotificationService.send(
        user_email=tenant_email,
        title="Perpanjangan Kontrak Disetujui",
        desc=f"Pengajuan perpanjangan unit #{unit_no} disetujui. Kontrak baru berakhir {new_lease_end.strftime('%d %B %Y')}. {bills_created} tagihan telah dibuat.",
        type="approval",
    )

    return {
        "status": "success",
        "new_lease_end": new_lease_end.isoformat(),
        "bills_created": bills_created,
    }