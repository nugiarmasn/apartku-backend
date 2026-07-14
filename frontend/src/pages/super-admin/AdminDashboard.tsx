import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { 
  Users, 
  Building2, 
  ShieldCheck, 
  TrendingUp, 
  ArrowUpRight, 
  Activity, 
  Mail,
  Zap
} from 'lucide-react';
import { NeoCard, NeoButton } from '../../components/ui/NeoUI';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import toast from 'react-hot-toast';

// Data simulasi pertumbuhan akun Gmail & Owner Partner
const globalGrowthData = [
  { name: 'Sen', users: 120, owners: 12 },
  { name: 'Sel', users: 210, owners: 15 },
  { name: 'Rab', users: 180, owners: 18 },
  { name: 'Kam', users: 340, owners: 22 },
  { name: 'Jum', users: 290, owners: 25 },
  { name: 'Sab', users: 450, owners: 28 },
  { name: 'Min', users: 520, owners: 30 },
];

export const AdminDashboard = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalOwners, setTotalOwners] = useState(0);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setTotalUsers(snap.size);
    });

    const unsubOwners = onSnapshot(collection(db, "owners"), (snap) => {
      setTotalOwners(snap.size);
    });

    const qRecent = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(5));
    const unsubRecent = onSnapshot(qRecent, (snap) => {
      setRecentUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubUsers(); unsubOwners(); unsubRecent(); };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total User Mobile" 
          value={totalUsers.toLocaleString()} 
          sub="Akun Gmail Terdaftar" 
          icon={<Users />} 
          color="bg-white" 
        />
        <StatCard 
          title="Total Owner" 
          value={totalOwners.toLocaleString()} 
          sub="Mitra Gedung Aktif" 
          icon={<Building2 />} 
          color="bg-gold" 
        />
        <StatCard 
          title="Sistem Health" 
          value="99.9%" 
          sub="Face ID Login Secure" 
          icon={<ShieldCheck />} 
          color="bg-white" 
        />
        <StatCard 
          title="Total Revenue" 
          value="Rp 2.4B" 
          sub="Platform Fee / Month" 
          icon={<TrendingUp />} 
          color="bg-navy text-white" 
        />
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        <NeoCard className="col-span-12 lg:col-span-8 bg-white border-[6px]">
          <div className="flex justify-between items-center mb-10 border-b-4 border-black pb-4">
            <div>
              <h3 className="text-2xl font-[900] uppercase italic tracking-tighter">Ecosystem Activity</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Monitoring User & Owner Growth</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 font-black text-[10px] uppercase">
                  <div className="w-3 h-3 bg-navy border-2 border-black"></div> User Gmail
               </div>
               <div className="flex items-center gap-2 font-black text-[10px] uppercase">
                  <div className="w-3 h-3 bg-gold border-2 border-black"></div> Owners
               </div>
            </div>
          </div>

          <div className="w-full h-[350px] min-h-[350px] flex items-center justify-center">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={globalGrowthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000" strokeOpacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontWeight: '900', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontWeight: '900', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#F5A623', opacity: 0.1}}
                  contentStyle={{ border: '4px solid black', fontWeight: '900', textTransform: 'uppercase' }} 
                />
                <Bar dataKey="users" fill="#0F1F3D" stroke="#000" strokeWidth={3} />
                <Bar dataKey="owners" fill="#F5A623" stroke="#000" strokeWidth={3} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeoCard>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <NeoCard className="bg-navy text-white h-full border-[6px]">
            <div className="flex items-center gap-3 mb-6 text-gold">
               <Zap size={24} strokeWidth={3} />
               <h4 className="text-xl font-[900] uppercase italic tracking-tighter">Command Center</h4>
            </div>
            
            <div className="space-y-4">
              <AdminActionBtn label="Broadcast Notification" />
              <AdminActionBtn label="System Security Audit" />
              <AdminActionBtn label="Global Revenue Export" />
              <AdminActionBtn label="Manage Whitelist Email" />
            </div>

            <div className="mt-12 bg-white/10 p-4 border-2 border-white/20 border-dashed">
               <div className="flex items-center gap-2 text-gold mb-2">
                  <Activity size={16} />
                  <span className="font-black text-[10px] uppercase italic">Server Status</span>
               </div>
               <p className="font-bold text-xs">Semua node API FastAPI beroperasi normal (Latency: 24ms)</p>
            </div>
          </NeoCard>
        </div>

        <NeoCard className="col-span-12 p-0 overflow-hidden border-[6px]">
          <div className="p-6 border-b-4 border-black bg-white flex justify-between items-center">
            <h3 className="text-2xl font-[900] uppercase italic tracking-tighter">Global Login Activity</h3>
            <NeoButton variant="white" className="py-1 px-4 text-xs italic">View All Logs</NeoButton>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-100 border-b-4 border-black">
                  <th className="p-4 font-black uppercase text-[10px]">Full Name</th>
                  <th className="p-4 font-black uppercase text-[10px]">Email Account</th>
                  <th className="p-4 font-black uppercase text-[10px]">Method</th>
                  <th className="p-4 font-black uppercase text-[10px]">Device Status</th>
                  <th className="p-4 font-black uppercase text-[10px] text-right">Registered At</th>
                </tr>
              </thead>
              <tbody className="font-bold">
                {recentUsers.map((user, i) => (
                  <tr key={i} className="border-b-2 border-black/10 hover:bg-yellow-50 transition-colors">
                    <td className="p-4">
                      <p className="font-black text-sm uppercase tracking-tight">
                        {user.full_name || user.fullName || "Akun Gmail"}
                      </p>
                    </td>
                    <td className="p-4 italic text-gray-400 text-xs">
                      {user.email}
                    </td>
                    <td className="p-4">
                      <span className="bg-navy text-white px-2 py-0.5 text-[8px] font-black border border-black shadow-neo">
                        GOOGLE
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black uppercase italic tracking-tighter ${user.faceIdActive ? 'text-green-600' : 'text-gray-400'}`}>
                        {user.faceIdActive ? '✓ FACE_ID_OK' : '⚠ NO_BIOMETRIC'}
                      </span>
                    </td>
                    <td className="p-4 text-right text-[10px] text-gray-400 uppercase italic">
                      {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'Baru Saja'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </NeoCard>

      </div>
    </div>
  );
};

const StatCard = ({ title, value, sub, icon, color }: any) => (
  <NeoCard className={`${color} flex flex-col justify-between h-44 border-[5px]`}>
    <div className="flex justify-between items-start">
      <div className={`p-2 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] text-black`}>
        {icon}
      </div>
    </div>
    <div className="text-left">
      <p className="text-[10px] font-black uppercase italic opacity-60 leading-none mb-1">{title}</p>
      <h3 className="text-4xl font-[900] uppercase tracking-tighter italic leading-none">{value}</h3>
      <p className="text-[8px] font-bold uppercase tracking-[0.2em] mt-1 opacity-40">{sub}</p>
    </div>
  </NeoCard>
);

const AdminActionBtn = ({ label }: { label: string }) => (
  <button className="w-full flex justify-between items-center bg-white text-black p-4 border-4 border-black font-[900] uppercase italic text-xs shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
    {label}
    <ArrowUpRight size={18} strokeWidth={3} />
  </button>
);