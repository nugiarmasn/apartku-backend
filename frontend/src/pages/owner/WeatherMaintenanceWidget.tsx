import { useEffect, useState } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getLocationWeatherData, type WeatherForecast, type AirQuality } from '../../services/weatherService';
import { NeoCard } from '../../components/ui/NeoUI';
import { CloudRain, Sun, AlertTriangle, Loader2, Wind, Droplets, Wrench } from 'lucide-react';

interface Building {
  id: string;
  name: string;
  city: string;
  tier?: string; // "Ekonomis" | "Standar" | dst — dipakai sebagai bobot risiko
}

type RiskLevel = 'RENDAH' | 'SEDANG' | 'TINGGI';

interface RiskResult {
  level: RiskLevel;
  score: number; // 0 - 100
  reasons: string[];
  recommendation: string;
}

/**
 * FUSION LOGIC — inti dari integrasi big data di komponen ini.
 * Menggabungkan 3 sumber data (2 eksternal + 1 internal) jadi satu skor risiko:
 *  1. Prediksi cuaca (eksternal) -> berapa hari hujan dalam 5 hari ke depan
 *  2. Kualitas udara (eksternal) -> AQI, indikasi kebutuhan maintenance ventilasi/AC
 *  3. Riwayat komplain kebocoran (internal, Firestore) -> histori masalah nyata di gedung
 *  4. Tier gedung (internal, Firestore) -> gedung tier "Ekonomis" diasumsikan
 *     infrastruktur lebih tua, jadi punya bobot risiko tambahan
 */
function computeMaintenanceRisk(
  forecast: WeatherForecast[],
  airQuality: AirQuality,
  leakComplaintCount: number,
  buildingTier?: string
): RiskResult {
  const rainyDays = forecast.filter((f) => f.isRainy).length;
  const reasons: string[] = [];
  let score = 0;

  // Bobot #1: curah hujan yang diprediksi (maks 40 poin)
  const rainScore = Math.min(rainyDays * 10, 40);
  score += rainScore;
  if (rainyDays > 0) reasons.push(`Diprediksi hujan ${rainyDays} dari 5 hari ke depan`);

  // Bobot #2: riwayat komplain kebocoran internal (maks 35 poin)
  const leakScore = Math.min(leakComplaintCount * 12, 35);
  score += leakScore;
  if (leakComplaintCount > 0) reasons.push(`${leakComplaintCount} riwayat keluhan bocor/rembes tercatat`);

  // Bobot #3: kualitas udara (maks 15 poin) — AQI 3 ke atas artinya filter AC/ventilasi
  // butuh perhatian lebih, terutama unit di lantai rendah dekat jalan raya
  const aqiScore = airQuality.aqi >= 3 ? 15 : airQuality.aqi === 2 ? 7 : 0;
  score += aqiScore;
  if (airQuality.aqi >= 3) reasons.push(`Kualitas udara "${airQuality.label}" (AQI ${airQuality.aqi})`);

  // Bobot #4: tier gedung (maks 10 poin) — proxy usia infrastruktur
  const tierScore = buildingTier?.toLowerCase() === 'ekonomis' ? 10 : 0;
  score += tierScore;
  if (tierScore > 0) reasons.push('Tier gedung "Ekonomis" — infrastruktur cenderung lebih tua');

  score = Math.min(score, 100);

  let level: RiskLevel = 'RENDAH';
  let recommendation = 'Kondisi aman, tidak perlu tindakan khusus minggu ini.';
  if (score >= 60) {
    level = 'TINGGI';
    recommendation = 'Segera jadwalkan pengecekan unit rawan bocor & servis AC sebelum musim hujan puncak.';
  } else if (score >= 30) {
    level = 'SEDANG';
    recommendation = 'Siapkan teknisi on-call dan cek saluran air/talang di unit yang pernah lapor bocor.';
  }

  return { level, score, reasons, recommendation };
}

const riskColor: Record<RiskLevel, string> = {
  RENDAH: 'bg-green-100 border-green-500 text-green-700',
  SEDANG: 'bg-yellow-100 border-yellow-500 text-yellow-700',
  TINGGI: 'bg-red-100 border-red-500 text-red-700',
};

export const WeatherMaintenanceWidget = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [airQuality, setAirQuality] = useState<AirQuality | null>(null);
  const [leakComplaintCount, setLeakComplaintCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ambil daftar gedung owner (data internal)
  useEffect(() => {
    const email = auth.currentUser?.email;
    if (!email) return;
    (async () => {
      const q = query(collection(db, 'buildings'), where('ownerEmail', '==', email));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Building));
      setBuildings(list);
      if (list.length > 0) setSelectedId(list[0].id);
    })();
  }, []);

  // Ambil cuaca + AQI (eksternal) dan hitung keluhan bocor (internal) tiap kali gedung dipilih
  useEffect(() => {
    if (!selectedId) return;
    const building = buildings.find((b) => b.id === selectedId);
    if (!building?.city) return;

    setLoading(true);
    setError(null);
    (async () => {
      try {
        // Data eksternal: cuaca + kualitas udara, sekali fetch untuk koordinat yang sama
        const { forecast: wf, airQuality: aq } = await getLocationWeatherData(building.city);
        setForecast(wf);
        setAirQuality(aq);

        // Data internal: keluhan terkait bocor/air di gedung ini
        const qComplaints = query(collection(db, 'complaints'), where('buildingId', '==', selectedId));
        const snap = await getDocs(qComplaints);
        const leakRelated = snap.docs.filter((d) => {
          const desc = (d.data().description || d.data().desc || '').toLowerCase();
          return desc.includes('bocor') || desc.includes('atap') || desc.includes('air') || desc.includes('rembes');
        });
        setLeakComplaintCount(leakRelated.length);
      } catch (e: any) {
        console.error(e);
        setError(e.message || 'Gagal memuat data untuk lokasi ini.');
        setForecast([]);
        setAirQuality(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedId, buildings]);

  const selectedBuilding = buildings.find((b) => b.id === selectedId);
  const risk =
    airQuality && forecast.length > 0
      ? computeMaintenanceRisk(forecast, airQuality, leakComplaintCount, selectedBuilding?.tier)
      : null;

  return (
    <NeoCard className="bg-white border-[6px] p-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xl font-[900] uppercase italic text-navy">Prediksi Cuaca & Maintenance</h4>
        <select
          className="border-4 border-black p-2 font-bold text-xs shadow-neo"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center"><Loader2 className="animate-spin" /></div>
      ) : error ? (
        <div className="p-4 bg-red-100 border-4 border-red-500 text-xs font-bold text-red-700">
          {error}
        </div>
      ) : (
        <>
          {/* SKOR RISIKO — hasil fusion data eksternal + internal */}
          {risk && (
            <div className={`mb-4 p-4 border-4 flex items-start gap-3 ${riskColor[risk.level]}`}>
              <AlertTriangle className="shrink-0" size={24} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-black uppercase italic">Risiko Maintenance: {risk.level}</p>
                  <span className="text-[10px] font-bold">{risk.score}/100</span>
                </div>
                <ul className="text-[11px] font-semibold list-disc list-inside mb-2 opacity-90">
                  {risk.reasons.length > 0 ? risk.reasons.map((r, i) => <li key={i}>{r}</li>) : <li>Tidak ada indikator risiko signifikan</li>}
                </ul>
                <p className="text-xs font-bold flex items-center gap-1">
                  <Wrench size={14} /> {risk.recommendation}
                </p>
              </div>
            </div>
          )}

          {/* FORECAST 5 HARI — data eksternal #1, sekarang dengan kelembapan & angin */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {forecast.map((f) => (
              <div key={f.date} className="border-2 border-black p-2 text-center">
                <p className="text-[9px] font-black">{new Date(f.date).toLocaleDateString('id-ID', { weekday: 'short' })}</p>
                {f.isRainy ? <CloudRain className="mx-auto my-1 text-blue-500" size={20} /> : <Sun className="mx-auto my-1 text-yellow-500" size={20} />}
                <p className="text-xs font-bold">{f.temp}°C</p>
                <div className="flex items-center justify-center gap-1 mt-1 text-[8px] font-bold text-gray-500">
                  <Droplets size={10} /> {f.humidity}%
                </div>
                <div className="flex items-center justify-center gap-1 text-[8px] font-bold text-gray-500">
                  <Wind size={10} /> {f.windSpeed}m/s
                </div>
              </div>
            ))}
          </div>

          {/* KUALITAS UDARA — data eksternal #2 */}
          {airQuality && (
            <div className="flex items-center justify-between p-3 border-2 border-black bg-gray-50 text-[10px] font-black uppercase">
              <span>Kualitas Udara: {airQuality.label} (AQI {airQuality.aqi})</span>
              <span className="text-gray-500">PM2.5: {airQuality.pm2_5.toFixed(1)} · PM10: {airQuality.pm10.toFixed(1)} µg/m³</span>
            </div>
          )}
        </>
      )}
    </NeoCard>
  );
};