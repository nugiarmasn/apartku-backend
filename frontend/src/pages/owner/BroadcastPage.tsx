import { useEffect, useState } from 'react';
import { db, auth } from '../../firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { NeoCard, NeoButton, NeoInput } from '../../components/ui/NeoUI';
import { Megaphone, Send, Clock, Building2, AlertOctagon, Info, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const BroadcastPage = () => {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // State Form
  const [targetBld, setTargetBld] = useState('all');
  const [category, setCategory] = useState('INFO');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  // 1. Tarik Data Gedung & Riwayat Broadcast
  useEffect(() => {
    const email = auth.currentUser?.email;
    if (!email) return;

    // Ambil daftar gedung buat pilihan target
    const qBld = query(collection(db, "buildings"), where("ownerEmail", "==", email));
    const unsubBld = onSnapshot(qBld, (snap) => {
      setBuildings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Ambil riwayat broadcast
    const qHist = query(
      collection(db, "broadcasts"), 
      where("ownerEmail", "==", email),
      orderBy("createdAt", "desc")
    );
    const unsubHist = onSnapshot(qHist, (snap) => {
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubBld(); unsubHist(); };
  }, []);

  // 2. Fungsi Kirim Broadcast
  const handleSend = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "broadcasts"), {
        title,
        message,
        category,
        targetBuildingId: targetBld,
        targetName: targetBld === 'all' ? 'Semua Gedung' : buildings.find(b => b.id === targetBld)?.name,
        ownerEmail: auth.currentUser?.email,
        createdAt: serverTimestamp()
      });

      toast.success('PENGUMUMAN BERHASIL DISIARKAN!', {
        style: {
          border: '4px solid black',
          padding: '16px',
          fontWeight: '900',
          borderRadius: '0px',
          boxShadow: '4px 4px 0px 0px #000',
        },
      });
      
      setTitle('');
      setMessage('');
    } catch (err) {
      toast.error('Gagal kirim broadcast', {
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="border-b-8 border-black pb-6 flex items-center gap-4">
        <div className="bg-navy p-4 border-4 border-black shadow-neo rotate-3 text-gold">
           <Megaphone size={40} strokeWidth={3} />
        </div>
        <div>
          <h2 className="text-6xl font-[900] uppercase italic tracking-tighter leading-none text-navy">Broadcast Hub.</h2>
          <p className="font-black text-gray-400 uppercase text-[10px] mt-2 italic tracking-[0.3em]">Siaran Pengumuman Massal ke Tenant</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* --- FORM KIRIM PESAN (KIRI) --- */}
        <div className="col-span-12 lg:col-span-7">
          <NeoCard className="bg-white border-[6px]">
            <form onSubmit={handleSend} className="space-y-6 text-black">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Target Gedung */}
                <div>
                  <label className="text-[10px] font-black uppercase italic text-navy">Target Audience</label>
                  <select 
                    className="w-full border-4 border-black p-4 font-bold shadow-neo focus:outline-none bg-white mt-1"
                    value={targetBld}
                    onChange={(e) => setTargetBld(e.target.value)}
                  >
                    <option value="all">SELURUH GEDUNG (GLOBAL)</option>
                    {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                {/* Kategori */}
                <div>
                  <label className="text-[10px] font-black uppercase italic text-navy">Message Category</label>
                  <select 
                    className="w-full border-4 border-black p-4 font-bold shadow-neo focus:outline-none bg-white mt-1"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="INFO">INFO UMUM (BIRU)</option>
                    <option value="URGENT">DARURAT / URGENT (MERAH)</option>
                    <option value="MAINTENANCE">PERBAIKAN / TEKNIS (KUNING)</option>
                  </select>
                </div>
              </div>

              <NeoInput 
                label="Judul Pengumuman" 
                placeholder="Contoh: Jadwal Fogging Bulan Juni" 
                value={title}
                onChange={(e:any) => setTitle(e.target.value)}
                required 
              />

              <div>
                <label className="text-[10px] font-black uppercase italic text-navy">Isi Pesan / Body</label>
                <textarea 
                  className="w-full border-4 border-black p-4 font-bold shadow-neo focus:outline-none bg-white mt-1 min-h-[200px]"
                  placeholder="Tulis detail informasi di sini..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <NeoButton 
                variant="gold" 
                className="w-full py-6 text-2xl flex justify-center items-center gap-4"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Send size={28} strokeWidth={3} /> SIARKAN PESAN SEKARANG</>}
              </NeoButton>
            </form>
          </NeoCard>
        </div>

        {/* --- RIWAYAT BROADCAST (KANAN) --- */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <h4 className="text-2xl font-[900] uppercase italic tracking-tighter border-l-8 border-gold pl-4 mb-4">Broadcast Log</h4>
          
          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
            {history.map((item) => (
              <NeoCard key={item.id} className="p-4 bg-gray-50 hover:translate-x-1 transition-all">
                <div className="flex justify-between items-start mb-3">
                   <div className={`px-2 py-0.5 border-2 border-black font-black text-[8px] uppercase shadow-[2px_2px_0px_#000]
                    ${item.category === 'URGENT' ? 'bg-red-400' : item.category === 'MAINTENANCE' ? 'bg-yellow-300' : 'bg-blue-400'}`}>
                    {item.category}
                   </div>
                   <div className="flex items-center gap-1 text-gray-400 text-[9px] font-black italic uppercase">
                      <Clock size={10} /> {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                   </div>
                </div>

                <h5 className="font-[900] uppercase italic text-lg leading-tight mb-1 text-navy">{item.title}</h5>
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-4 flex items-center gap-1">
                   <Building2 size={12}/> Target: {item.targetName}
                </p>
                <p className="text-xs font-bold text-gray-600 italic line-clamp-2">"{item.message}"</p>
              </NeoCard>
            ))}

            {history.length === 0 && (
              <div className="py-20 text-center border-4 border-dashed border-gray-200">
                <p className="font-black text-gray-300 uppercase italic">Belum ada riwayat siaran</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};