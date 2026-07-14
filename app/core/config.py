from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # =========================
    # APP
    # =========================
    PROJECT_NAME: str = "ApartKu"
    # =========================
    # YOUTUBE
    # =========================
    YOUTUBE_API_KEY: str
    # =========================
    # OPENWEATHER
    # =========================
    OPENWEATHER_API_KEY: str
    # =========================
    # FIREBASE
    # =========================
    FIREBASE_SERVICE_ACCOUNT_PATH: str = "serviceAccountKey.json"
    # =========================
    # MIDTRANS
    # =========================
    MIDTRANS_SERVER_KEY: str
    MIDTRANS_CLIENT_KEY: str
    MIDTRANS_IS_PRODUCTION: bool = False
    # =========================
    # SMTP EMAIL OTP
    # =========================
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    HF_TOKEN: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
