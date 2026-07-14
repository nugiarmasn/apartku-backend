import { useEffect, useState } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { api } from '../../api';
import { NeoCard } from '../../components/ui/NeoUI';
import { MessageCircle, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Building {
  id: string;
  name: string;
  city: string;
}

interface SentimentSummary {
  positif: number;
  netral: number;
  negatif: number;
}

interface CommentLog {
  comment: string;
  sentiment: string;
  category: string;
  author?: string;
}

type SatisfactionLevel = 'RENDAH' | 'CUKUP' | 'BAIK' | 'SANGAT BAIK';

interface SatisfactionResult {
  index: number; // 0 - 100
  level: SatisfactionLevel;
  externalScore: number;
  internalScore: number;
  reasons: string[];
}

/**
 * FUSION: gabungkan sentimen publik (eksternal, YouTube) dengan
 * volume & kategori komplain riil (internal, Firestore) jadi satu index.
 * Bobot internal lebih besar (60%) karena itu data operasional aktual gedung ini,
 * sementara sentimen YouTube (40%) dipakai sebagai konteks persepsi pasar umum
 * -- BUKAN klaim ulasan spesifik gedung ini, karena gedung kecil jarang
 * punya video YouTube dedicated.
 */
function computeSatisfactionIndex(
  sentiment: SentimentSummary,
  totalComplaints: number,
  securityComplaints: number
): SatisfactionResult {
  const totalSentiment = sentiment.positif + sentiment.netral + sentiment.negatif;
  const externalScore = totalSentiment > 0 ? Math.round((sentiment.positif / totalSentiment) * 100) : 50;

  // Skor internal: makin banyak & makin berat kategori komplain, makin turun skornya
  let internalScore = 100 - Math.min(totalComplaints * 8, 60);
  internalScore -= securityComplaints * 10; // komplain keamanan dibobot lebih berat
  internalScore = Math.max(internalScore, 0);

  const index = Math.round(externalScore * 0.4 + internalScore * 0.6);

  const reasons: string[] = [];
  if (totalComplaints > 0) reasons.push(`${totalComplaints} komplain aktif tercatat di gedung ini`);
  if (securityComplaints > 0) reasons.push(`${securityComplaints} di antaranya terkait keamanan`);
  if (totalSentiment > 0) {
    reasons.push(`Sentimen publik industri apartemen: ${externalScore}% positif (konteks pasar umum)`);
  } else {
    reasons.push('Belum ada data sentimen publik untuk topik ini');
  }

  let level: SatisfactionLevel = 'BAIK';
  if (index < 40) level = 'RENDAH';
  else if (index < 60) level = 'CUKUP';
  else if (index < 80) level = 'BAIK';
  else level = 'SANGAT BAIK';

  return { index, level, externalScore, internalScore, reasons };
}

const levelColor: Record<SatisfactionLevel, string> = {
  RENDAH: 'bg-red-100 border-red-500 text-red-700',
  CUKUP: 'bg-yellow-100 border-yellow-500 text-yellow-700',
  BAIK: 'bg-blue-100 border-blue-500 text-blue-700',
  'SANGAT BAIK': 'bg-green-100 border-green-500 text-green-700',
};

export const TenantSentimentWidget = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [sentiment, setSentiment] = useState<SentimentSummary>({ positif: 0, netral: 0, negatif: 0 });
  const [comments, setComments] = useState<CommentLog[]>([]);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [securityComplaints, setSecurityComplaints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!selectedId) return;
    const building = buildings.find((b) => b.id === selectedId);
    if (!building) return;

    setLoading(true);
    setError(null);
    (async () => {
      try {
        // Eksternal: sentimen publik industri apartemen (konteks pasar, bukan spesifik gedung ini)
        const searchTopic = `apartemen ${building.city} review`;
        const res = await api.get(`/analytics/youtube?q=${encodeURIComponent(searchTopic)}`);
        const dist = res.data?.summary?.sentiment_distribution || {};
        setSentiment({
          positif: dist.positif || 0,
          netral: dist.netral || 0,
          negatif: dist.negatif || 0,
        });
        setComments((res.data?.raw_data || []).slice(0, 3));

        // Internal: komplain riil gedung ini
        const qComplaints = query(collection(db, 'complaints'), where('buildingId', '==', selectedId));
        const snap = await getDocs(qComplaints);
        setTotalComplaints(snap.size);
        setSecurityComplaints(
          snap.docs.filter((d) => (d.data().category || '').toUpperCase() === 'SECURITY').length
        );
      } catch (e: any) {
        console.error(e);
        setError('Gagal memuat data sentimen. Cek koneksi backend.');
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedId, buildings]);

  const satisfaction = computeSatisfactionIndex(sentiment, totalComplaints, securityComplaints);
  const pieData = [
    { name: 'Positif', value: sentiment.positif, color: '#4ADE80' },
    { name: 'Netral', value: sentiment.netral, color: '#F5A623' },
    { name: 'Negatif', value: sentiment.negatif, color: '#F87171' },
  ];

  return (
    <NeoCard className="bg-white border-[6px] p-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xl font-[900] uppercase italic text-navy">Tenant Satisfaction Index</h4>
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
        <div className="p-4 bg-red-100 border-4 border-red-500 text-xs font-bold text-red-700">{error}</div>
      ) : (
        <>
          {/* SKOR GABUNGAN */}
          <div className={`mb-4 p-4 border-4 ${levelColor[satisfaction.level]}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-black uppercase italic">Index: {satisfaction.level}</p>
              <span className="text-lg font-black">{satisfaction.index}/100</span>
            </div>
            <ul className="text-[11px] font-semibold list-disc list-inside opacity-90">
              {satisfaction.reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
            <p className="text-[9px] mt-2 opacity-70 italic">
              *Sentimen publik bersifat konteks industri umum, bukan ulasan spesifik gedung ini.
              Skor internal (komplain riil) diberi bobot lebih besar.
            </p>
          </div>

          <div className="grid grid-cols-12 gap-4">
            {/* PIE CHART SENTIMEN EKSTERNAL */}
            <div className="col-span-12 md:col-span-5 h-[180px] flex flex-col items-center">
              <ResponsiveContainer width="99%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={40} outerRadius={65} paddingAngle={5} dataKey="value" stroke="#000" strokeWidth={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-2 text-[8px] font-black uppercase">
                <span className="flex items-center gap-1"><TrendingUp size={10} className="text-green-500" />{sentiment.positif}</span>
                <span className="flex items-center gap-1"><Minus size={10} className="text-gold" />{sentiment.netral}</span>
                <span className="flex items-center gap-1"><TrendingDown size={10} className="text-red-500" />{sentiment.negatif}</span>
              </div>
            </div>

            {/* LOG KOMENTAR */}
            <div className="col-span-12 md:col-span-7 space-y-2">
              <p className="text-[10px] font-black uppercase flex items-center gap-1"><MessageCircle size={12} /> Cuplikan Sentimen Publik</p>
              {comments.length > 0 ? comments.map((c, i) => (
                <div key={i} className="border-2 border-black p-2 bg-gray-50 text-[10px] font-bold italic">
                  "{c.comment}"
                  <span className="block text-[8px] not-italic font-black text-gray-500 mt-1">{c.category} · {c.sentiment}</span>
                </div>
              )) : (
                <p className="text-[10px] font-bold text-gray-400 italic">Belum ada data untuk topik ini.</p>
              )}
            </div>
          </div>
        </>
      )}
    </NeoCard>
  );
};