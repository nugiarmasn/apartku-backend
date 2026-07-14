from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router

app = FastAPI(title="ApartKu API")

# Neo-Brutalism Frontend biasanya jalan di port 3000 (React) atau 5173 (Vite)
# Tambahkan link Ngrok ke dalam allow_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Frontend local Vite
        "http://localhost:3000",   # Alternative port React
        "https://maturely-olympics-stipulate.ngrok-free.dev",  # Link Ngrok buat testing via internet
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to ApartKu API System"}