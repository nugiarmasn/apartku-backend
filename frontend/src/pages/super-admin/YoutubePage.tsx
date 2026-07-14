import { useState } from 'react';
import { NeoCard, NeoButton, NeoInput } from '../../components/ui/NeoUI';
import { Search, MessageCircle, BarChart2, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { api } from '../../api';
import toast from 'react-hot-toast';

export const YoutubePage = () => {
  const [search, setSearch] = useState('Apartemen Indonesia');
  const [loading, setLoading] = useState(false);

  const [sentimentData, setSentimentData] = useState([
    { name: 'Positif', value: 0, color: '#4ADE80' },
    { name: 'Netral', value: 0, color: '#F5A623' },
    { name: 'Negatif', value: 0, color: '#F87171' },
  ]);

  const [commentLogs, setCommentLogs] = useState<any[]>([]);

  const handleStartAnalysis = async () => {
    setLoading(true);

    try {
      const response = await api.get(`/analytics/youtube?q=${search}`);
      const res = response.data;

      console.log('DATA DITERIMA:', res);

      if (res.status === 'success') {
        const dist = res.summary?.sentiment_distribution || {};
        const pos = dist.positive || dist.positif || 0;
        const neu = dist.neutral || dist.netral || 0;
        const neg = dist.negative || dist.negatif || 0;

        console.log('LOGIKA BARU - Nilai Terdeteksi:', { pos, neu, neg });

        setSentimentData([
          { name: 'Positif', value: pos, color: '#4ADE80' },
          { name: 'Netral', value: neu, color: '#F5A623' },
          { name: 'Negatif', value: neg, color: '#F87171' },
        ]);

        setCommentLogs(res.raw_data || []);
      }
    } catch (error) {
      console.error('Gagal tarik data YouTube:', error);
      toast.error('Cek Koneksi Backend!', {
        style: {
          border: '4px solid black',
          padding: '16px',
          fontWeight: '900',
          borderRadius: '0px',
          boxShadow: '4px 4px 0px 0px #000',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* SEARCH BAR */}
      <NeoCard className="bg-navy text-white border-black">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <NeoInput
              label="Analisis Topik YouTube (AI Search)"
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              className="mb-0 bg-white"
            />
          </div>
          <NeoButton
            variant="gold"
            className="h-[60px] min-w-[200px] flex gap-2 items-center justify-center"
            onClick={handleStartAnalysis}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Search size={20} strokeWidth={3} />}
            {loading ? 'MENGANALISIS...' : 'MULAI ANALISIS AI'}
          </NeoButton>
        </div>
      </NeoCard>

      <div className="grid grid-cols-12 gap-8">

        {/* BOX GRAFIK */}
        <NeoCard className="col-span-12 lg:col-span-5 flex flex-col min-h-[450px]">
          <h4 className="text-xl font-[900] uppercase italic border-b-4 border-black pb-2 mb-8 flex items-center gap-2">
            <BarChart2 size={24} /> Sentiment Distribution
          </h4>

          <div className="w-full h-[320px] min-h-[320px] flex items-center justify-center">
            <ResponsiveContainer width="99%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="#000"
                  strokeWidth={4}
                  animationDuration={1000}
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    border: '4px solid black',
                    fontWeight: '900',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* LEGEND */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {sentimentData.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-2 font-black text-[10px] uppercase border-2 border-black px-2 py-1 bg-white shadow-[2px_2px_0px_0px_#000]"
              >
                <div
                  className="w-3 h-3 border border-black"
                  style={{ backgroundColor: item.color }}
                ></div>
                {item.name}: {item.value}
              </div>
            ))}
          </div>
        </NeoCard>

        {/* COMMENT LOGS */}
        <NeoCard className="col-span-12 lg:col-span-7 bg-white overflow-hidden flex flex-col">
          <h4 className="text-xl font-[900] uppercase italic border-b-4 border-black pb-2 mb-6 flex items-center gap-2 text-navy">
            <MessageCircle size={24} /> AI Sentiment Logs
          </h4>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {commentLogs.length > 0 ? (
              commentLogs.map((log, i) => (
                <div
                  key={i}
                  className="border-4 border-black p-4 shadow-neo flex flex-col gap-2 bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-black text-xs text-navy italic">
                      UserID: {log.video_id || 'YouTube User'}
                    </span>
                    <div className="flex gap-2">
                      <span
                        className={`text-[8px] font-black border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_0px_#000]
                        ${
                          log.sentiment === 'positive'
                            ? 'bg-green-400'
                            : log.sentiment === 'negative'
                            ? 'bg-red-400'
                            : 'bg-gold'
                        }`}
                      >
                        {log.sentiment?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                  </div>
                  <p className="font-bold text-sm italic uppercase leading-tight">
                    "{log.text || log.comment}"
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-20 border-4 border-dashed border-gray-200">
                <p className="font-black text-gray-300 uppercase italic">
                  Belum ada data analisis
                </p>
              </div>
            )}
          </div>
        </NeoCard>

      </div>
    </div>
  );
};