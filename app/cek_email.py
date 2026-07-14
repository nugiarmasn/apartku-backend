import smtplib
from email.message import EmailMessage

# Akun GMAIL PENGIRIM (yang generate App Password)
EMAIL_PENGIRIM = "limejuicejr@gmail.com"
APP_PASS = "rxijmlvgbpajgrsf"  # Pastikan tanpa spasi

# Email TUJUAN (boleh email kampus, boleh email manapun)
EMAIL_TUJUAN = "widi54804@gmail.com"

msg = EmailMessage()
msg.set_content("Halo bro, ini tes OTP: 999888")
msg['Subject'] = "TES APARTKU"
msg['From'] = EMAIL_PENGIRIM
msg['To'] = EMAIL_TUJUAN   # ← Kirim ke kampus, bukan login pakai ini

print("Sedang mencoba menghubungi Gmail...")
try:
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login(EMAIL_PENGIRIM, APP_PASS)   # ← Login pakai akun Gmail, BUKAN email kampus
        smtp.send_message(msg)
    print("MANTAP! Email terkirim ke inbox lo.")
except Exception as e:
    print(f"GAGAL TOTAL: {e}")