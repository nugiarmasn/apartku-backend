import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from dotenv import load_dotenv

load_dotenv()

# Konfigurasi ini harus sama persis dengan script 'cek_email.py' lo yang sukses
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=587,  # Pakai Port 587 sesuai tes lo
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,  # Wajib True buat Port 587
    MAIL_SSL_TLS=False,  # Wajib False buat Port 587
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_otp_email(email: EmailStr, otp: str):
    html = f"""
    <div style="font-family: sans-serif; border: 4px solid black; padding: 30px; background-color: white;">
        <h1 style="text-transform: uppercase; font-weight: 900; italic: true;">APARTKU.</h1>
        <p style="font-weight: bold; text-transform: uppercase;">Kode Verifikasi Keamanan Anda:</p>
        <div style="background-color: #F5A623; border: 4px solid black; padding: 20px; font-size: 40px; font-weight: 900; text-align: center; margin: 20px 0;">
            {otp}
        </div>
        <p style="font-size: 12px; font-weight: bold; color: #666;">KODE BERLAKU SELAMA 5 MENIT.</p>
    </div>
    """
    
    message = MessageSchema(
        subject="ApartKu - Kode Verifikasi OTP",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)