// src/services/weatherService.ts
const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY;

export interface WeatherForecast {
  date: string;
  temp: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  isRainy: boolean;
  icon: string;
}

export interface AirQuality {
  aqi: number; // 1 (Good) - 5 (Very Poor), skala resmi OpenWeather
  label: string;
  pm2_5: number;
  pm10: number;
}

export interface LocationWeatherData {
  coords: { lat: number; lon: number };
  forecast: WeatherForecast[];
  airQuality: AirQuality;
}

interface GeoResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

/**
 * Convert nama kota jadi koordinat lat/lon lewat OpenWeather Geocoding API.
 * Endpoint ini jauh lebih toleran untuk nama kota/kecamatan Indonesia
 * dibanding endpoint lama yang pakai q=namakota langsung ke forecast.
 */
async function getCoordinates(city: string): Promise<{ lat: number; lon: number }> {
  const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
    city
  )},ID&limit=1&appid=${API_KEY}`;

  const res = await fetch(geoUrl);
  if (!res.ok) throw new Error(`Gagal mencari lokasi "${city}" (HTTP ${res.status})`);

  const data: GeoResult[] = await res.json();

  if (!data || data.length === 0) {
    // Fallback: coba tanpa kata arah mata angin, mis. "jakarta selatan" -> "jakarta"
    const simplified = city.replace(/\b(selatan|barat|utara|timur|pusat)\b/gi, '').trim();
    if (simplified && simplified.toLowerCase() !== city.toLowerCase()) {
      const fallbackRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(simplified)},ID&limit=1&appid=${API_KEY}`
      );
      const fallbackData: GeoResult[] = await fallbackRes.json();
      if (fallbackData?.length > 0) return { lat: fallbackData[0].lat, lon: fallbackData[0].lon };
    }
    throw new Error(`Lokasi "${city}" tidak ditemukan di OpenWeather`);
  }

  return { lat: data[0].lat, lon: data[0].lon };
}

/** Ambil forecast 5 hari (data eksternal #1) berdasarkan koordinat. */
async function fetchForecast(lat: number, lon: number): Promise<WeatherForecast[]> {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=id`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal ambil data cuaca (HTTP ${res.status})`);
  const data = await res.json();

  // Data asli per 3 jam -> ambil 1 titik per hari (jam 12:00) untuk 5 hari ke depan
  const daily = data.list.filter((item: any) => item.dt_txt.includes('12:00:00'));

  return daily.map((item: any) => ({
    date: item.dt_txt.split(' ')[0],
    temp: Math.round(item.main.temp),
    humidity: item.main.humidity,
    windSpeed: item.wind.speed,
    condition: item.weather[0].description,
    isRainy: item.weather[0].main === 'Rain' || item.weather[0].main === 'Thunderstorm',
    icon: item.weather[0].icon,
  }));
}

const AQI_LABELS: Record<number, string> = {
  1: 'Baik',
  2: 'Sedang',
  3: 'Tidak Sehat (Sensitif)',
  4: 'Tidak Sehat',
  5: 'Sangat Tidak Sehat',
};

/** Ambil kualitas udara (data eksternal #2) berdasarkan koordinat. */
async function fetchAirQuality(lat: number, lon: number): Promise<AirQuality> {
  const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal ambil data kualitas udara (HTTP ${res.status})`);
  const data = await res.json();
  const entry = data.list[0];

  return {
    aqi: entry.main.aqi,
    label: AQI_LABELS[entry.main.aqi] || 'Tidak diketahui',
    pm2_5: entry.components.pm2_5,
    pm10: entry.components.pm10,
  };
}

/**
 * Fungsi utama: gabungkan geocoding + forecast + air quality
 * jadi satu payload data eksternal untuk sebuah lokasi/gedung.
 */
export async function getLocationWeatherData(city: string): Promise<LocationWeatherData> {
  if (!API_KEY) {
    throw new Error('VITE_OPENWEATHER_KEY belum di-set di file .env frontend');
  }

  const coords = await getCoordinates(city);
  const [forecast, airQuality] = await Promise.all([
    fetchForecast(coords.lat, coords.lon),
    fetchAirQuality(coords.lat, coords.lon),
  ]);

  return { coords, forecast, airQuality };
}