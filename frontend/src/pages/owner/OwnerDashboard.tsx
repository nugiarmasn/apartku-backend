import { useEffect, useState } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { 
  Building2, 
  Users, 
  Receipt, 
  Wrench, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { NeoCard, NeoButton } from '../../components/ui/NeoUI';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import toast from 'react-hot-toast';
// 🔥 IMPORT WIDGET CUACA + MAINTENANCE
import { WeatherMaintenanceWidget } from './WeatherMaintenanceWidget';
// 🆕 IMPORT SENTIMEN TENANT
import { TenantSentimentWidget } from './TenantSentimentWidget';

// Data Simulasi Performa Gedung
const revenueData = [
  { name: 'Mei', value: 45 },
  { name: 'Jun', value: 52 },
  { name: 'Jul', value: 48 },
  { name: 'Agu', value: 61 },
];

const occupancyData = [
  { name: 'Terisi', value: 84, color: '#0F1F3D' },
  { name: 'Kosong', value: 36, color: '#F5A623' },
];

export const OwnerDashboard = () => {
  const [stats, setStats] = useState({ totalUnits: 0, occupied: 0, revenue: 0, issues: 0 });

  useEffect(() => {
    const email = auth.currentUser?.email;
    if (!email) return;

    const qUnit = query(collection(db, "units"), where("ownerEmail", "==", email));
    const unsubUnit = onSnapshot(qUnit, (snap) => {
      const all = snap.size;
      const filled = snap.docs.filter(d => d.data().status === 'Occupied').length;
      setStats(prev => ({ ...prev, totalUnits: all, occupied: filled }));
    });

    const qPay = query(collection(db, "bills"), where("owner_email", "==", email), where("status", "==", "PAID"));
    const unsubPay = onSnapshot(qPay, (snap) => {
      const total = snap.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);
      setStats(prev => ({ ...prev, revenue: total }));
    });

    const qIssue = query(collection(db, "complaints"), where("ownerEmail", "==", email), where("status", "==", "pending"));
    const unsubIssue = onSnapshot(qIssue, (snap) => {
      setStats(prev => ({ ...prev, issues: snap.size }));
    });

    return () => { unsubUnit(); unsubPay(); unsubIssue(); };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* 1. KARTU STATISTIK UTAMA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <OwnerStatCard title="Pendapatan IPL" value={`Rp ${(stats.revenue / 1000000).toFixed(1)}M`} sub="Bulan Agustus" icon={<TrendingUp />} color="bg-white" />
        <OwnerStatCard title="Okupansi Unit" value={`${stats.occupied}/${stats.totalUnits}`} sub={`${((stats.occupied/stats.totalUnits)*100 || 0).toFixed(0)}% Terisi`} icon={<Building2 />} color="bg-gold" />
        <OwnerStatCard title="Tagihan Pending" value="12" sub="Unit Belum Bayar" icon={<Receipt />} color="bg-white" />
        <OwnerStatCard title="Laporan Baru" value={stats.issues} sub="Butuh Teknisi" icon={<Wrench />} color="bg-red-400 text-white" />
      </div>

      {/* 🔥 TAMBAHAN: WEATHER + MAINTENANCE WIDGET & SENTIMEN */}
      <div className="grid grid-cols-1 gap-6">
        <WeatherMaintenanceWidget />
        <TenantSentimentWidget />
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* 2. REVENUE ANALYSIS (Kiri - Bar Chart) */}
        <NeoCard className="col-span-12 lg:col-span-7 bg-white">
          <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
            <h3 className="text-2xl font-[900] uppercase italic tracking-tighter">Revenue Analysis</h3>
            <span className="bg-navy text-white px-3 py-1 text-[10px] font-black border-2 border-black uppercase shadow-neo">Monthly Growth</span>
          </div>
          <div className="w-full h-[300px] min-h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={revenueData}>
                <XAxis dataKey="name" stroke="#000" tick={{fontWeight: '900', fontSize: 12}} />
                <Tooltip contentStyle={{ border: '4px solid black', fontWeight: '900' }} />
                <Bar dataKey="value" fill="#0F1F3D" stroke="#000" strokeWidth={3} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeoCard>

        {/* 3. UNIT DISTRIBUTION (Kanan - Pie Chart) */}
        <NeoCard className="col-span-12 lg:col-span-5 flex flex-col items-center justify-center">
          <h3 className="text-xl font-black uppercase italic mb-6 self-start border-b-2 border-black w-full pb-2">Room Availability</h3>
          <div className="w-full h-[300px] min-h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="99%" height="100%">
              <PieChart>
                <Pie data={occupancyData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="#000" strokeWidth={4}>
                  {occupancyData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 mt-4">
             {occupancyData.map(item => (
               <div key={item.name} className="flex items-center gap-2 font-black text-[10px] uppercase italic">
                  <div className="w-3 h-3 border-2 border-black" style={{ backgroundColor: item.color }}></div>
                  {item.name}: {item.value} Unit
               </div>
             ))}
          </div>
        </NeoCard>

        {/* 4. AI MAINTENANCE LOGS (Bawah - Real-time dari Tenant Mobile) */}
        <NeoCard className="col-span-12 lg:col-span-8 p-0 overflow-hidden border-[6px]">
          <div className="p-6 bg-navy text-white border-b-4 border-black flex justify-between items-center">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-gold" />
              <h3 className="text-2xl font-[900] uppercase italic tracking-tighter">Recent Complaints</h3>
            </div>
            <NeoButton variant="gold" className="py-1 px-4 text-[10px]">Manage Maintenance</NeoButton>
          </div>
          <div className="p-6 space-y-4 bg-white">
            <ComplaintItem unit="A-402" category="TECHNICAL" issue="Kran air bocor di dapur." status="PENDING" />
            <ComplaintItem unit="B-105" category="CLEANLINESS" issue="Bau tidak sedap di koridor." status="PROCESS" />
            <ComplaintItem unit="C-808" category="SECURITY" issue="Pintu balkon tidak bisa dikunci." status="PENDING" />
          </div>
        </NeoCard>

        {/* 5. QUICK ACTIONS FOR OWNER */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <NeoCard className="bg-gold border-black h-full">
              <h4 className="font-black uppercase italic mb-6 border-b-2 border-black pb-2 text-navy">Urgent Actions</h4>
              <div className="flex flex-col gap-4">
                <QuickLink label="Generate Mass Billing" />
                <QuickLink label="Update Data Tenant" />
                <QuickLink label="Broadcast Announcement" />
              </div>
           </NeoCard>
        </div>

      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const OwnerStatCard = ({ title, value, sub, icon, color }: any) => (
  <NeoCard className={`${color} flex flex-col justify-between h-44 border-[5px] text-black`}>
    <div className="flex justify-between items-start">
      <div className="p-2 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000]">{icon}</div>
    </div>
    <div>
      <p className="text-[10px] font-black uppercase italic opacity-60 leading-none mb-1">{title}</p>
      <h3 className="text-4xl font-[900] uppercase tracking-tighter italic mb-1">{value}</h3>
      <p className="text-[8px] font-bold uppercase tracking-widest text-black/40">{sub}</p>
    </div>
  </NeoCard>
);

const ComplaintItem = ({ unit, category, issue, status }: any) => (
  <div className="flex justify-between items-center p-4 border-4 border-black bg-gray-50 shadow-neo hover:translate-x-1 transition-all">
    <div className="flex gap-4 items-center">
      <div className="bg-navy text-gold p-2 font-black text-xs border-2 border-black italic">UNIT {unit}</div>
      <div>
        <span className="text-[8px] font-black uppercase bg-gold px-1 border border-black mb-1 inline-block text-black">{category}</span>
        <p className="text-sm font-bold uppercase italic leading-tight text-black">{issue}</p>
      </div>
    </div>
    <div className={`text-[10px] font-black px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_#000] ${status === 'PROCESS' ? 'bg-blue-400' : 'bg-yellow-300'} text-black`}>
      {status}
    </div>
  </div>
);

const QuickLink = ({ label }: { label: string }) => (
  <button className="w-full flex justify-between items-center bg-white text-black p-4 border-4 border-black font-[900] uppercase italic text-xs shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
    {label} <ArrowUpRight size={18} strokeWidth={3} />
  </button>
);