import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import requests
from datetime import datetime
from app.core.firebase_init import db
from app.core.config import settings
from app.services.youtube_service import YouTubeService

OPENWEATHER_KEY = settings.OPENWEATHER_API_KEY


def get_coordinates(city: str):
    url = f"https://api.openweathermap.org/geo/1.0/direct?q={city},ID&limit=1&appid={OPENWEATHER_KEY}"
    res = requests.get(url, timeout=15)
    res.raise_for_status()
    data = res.json()

    if not data:
        simplified = city
        for w in ["selatan", "barat", "utara", "timur", "pusat"]:
            simplified = simplified.replace(w, "").strip()
        if simplified and simplified.lower() != city.lower():
            res2 = requests.get(
                f"https://api.openweathermap.org/geo/1.0/direct?q={simplified},ID&limit=1&appid={OPENWEATHER_KEY}",
                timeout=15,
            )
            data2 = res2.json()
            if data2:
                return data2[0]["lat"], data2[0]["lon"]
        raise ValueError(f"Lokasi '{city}' tidak ditemukan di OpenWeather")

    return data[0]["lat"], data[0]["lon"]


def fetch_weather_snapshot(building_id: str, city: str):
    lat, lon = get_coordinates(city)

    forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={OPENWEATHER_KEY}&units=metric&lang=id"
    aqi_url = f"https://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OPENWEATHER_KEY}"

    forecast_res = requests.get(forecast_url, timeout=15).json()
    aqi_res = requests.get(aqi_url, timeout=15).json()

    daily = [item for item in forecast_res.get("list", []) if "12:00:00" in item["dt_txt"]]
    forecast_days = [
        {
            "date": item["dt_txt"].split(" ")[0],
            "temp": round(item["main"]["temp"]),
            "humidity": item["main"]["humidity"],
            "isRainy": item["weather"][0]["main"] in ["Rain", "Thunderstorm"],
        }
        for item in daily
    ]

    aqi_entry = aqi_res["list"][0]

    snapshot = {
        "buildingId": building_id,
        "city": city,
        "forecast": forecast_days,
        "aqi": aqi_entry["main"]["aqi"],
        "pm2_5": aqi_entry["components"]["pm2_5"],
        "pm10": aqi_entry["components"]["pm10"],
        "scrapedAt": datetime.utcnow().isoformat(),
    }

    db.collection("weather_snapshots").add(snapshot)
    print(f"[OK] Weather snapshot tersimpan untuk gedung {building_id} ({city})")


def run_weather_scrape():
    buildings = db.collection("buildings").stream()
    for b in buildings:
        data = b.to_dict()
        city = data.get("city")
        if not city:
            print(f"[SKIP] Gedung {b.id} tidak punya field 'city'")
            continue
        try:
            fetch_weather_snapshot(b.id, city)
        except Exception as e:
            print(f"[ERROR] Gedung {b.id} gagal di-scrape: {e}")


async def run_youtube_scrape():
    service = YouTubeService()
    topics = [
        "apartemen jakarta review",
        "apartemen bekasi review",
        "apartemen tangerang review",
    ]
    for topic in topics:
        try:
            insights = await service.get_realtime_insights(query=topic)
            print(f"[OK] YouTube insights tersimpan untuk topik '{topic}': {len(insights)} komentar")
        except Exception as e:
            print(f"[ERROR] Topik '{topic}' gagal di-scrape: {e}")


if __name__ == "__main__":
    print(f"=== Mulai scheduled scraping: {datetime.utcnow().isoformat()} UTC ===")
    run_weather_scrape()
    asyncio.run(run_youtube_scrape())
    print("=== Selesai ===")
