import { useEffect, useState } from 'react';
import { db, auth } from '../../firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { NeoCard, NeoButton } from '../../components/ui/NeoUI';
import { Wrench, Clock, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const MaintenancePage = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentOwnerEmail = auth.currentUser?.email;

    if (!currentOwnerEmail) {
      console.log("Owner belum login.");
      return;
    }

    const q = query(
      collection(db, "complaints"),
      where("ownerEmail", "==", currentOwnerEmail),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComplaints(data);
      setLoading(false);
    }, (error) => {
      console.error("Firebase Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateTicketStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "complaints", id), { 
        status: newStatus,
        updatedAt: serverTimestamp() 
      });
      
      toast.success(`Status diperbarui ke ${newStatus.toUpperCase()}`, {
        style: {
          border: '4px solid black',
          padding: '16px',
          fontWeight: '900',
          borderRadius: '0px',
          boxShadow: '4px 4px 0px 0px #000',
        },
      });
    } catch (err) {
      toast.error("Gagal update status!", {
        style: {
          border: '4px solid black',
          padding: '16px',
          fontWeight: '900',
          borderRadius: '0px',
          boxShadow: '4px 4px 0px 0px #000',
        },
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="border-b-8 border-black pb-6 flex justify-between items-end">
        <div>
          <h2 className="text-6xl font-[900] uppercase italic tracking-tighter leading-none text-navy">AI Fixit.</h2>
          <p className="font-black text-gray-400 uppercase text-[10px] mt-2 italic">
            Automated Complaint Management System
          </p>
        </div>
        <div className="bg-gold border-4 border-black p-3 shadow-neo flex items-center gap-2 rotate-1">
          <Sparkles size={20} />
          <span className="font-[900] text-[10px] uppercase italic">AI Monitoring Active</span>
        </div>
      </div>

      {loading ? (
        <p className="py-20 text-center font-black uppercase text-gray-300 italic">Syncing with database...</p>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {complaints.length > 0 ? complaints.map((item) => (
            <NeoCard key={item.id} className="relative overflow-hidden border-[6px] p-0 flex flex-col md:flex-row bg-white hover:translate-x-1 transition-all">
              
              <div className={`absolute top-0 right-0 px-6 py-2 border-l-6 border-b-6 border-black font-[900] italic text-[10px] uppercase
                ${item.category === 'TECHNICAL' || item.category === 'TEKNIS' ? 'bg-red-400' : 'bg-blue-400'}`}>
                {item.category}
              </div>
              
              <div className="w-full md:w-64 bg-gray-100 border-r-6 border-black p-6 flex flex-col items-center justify-center text-center gap-4">
                 <div className="bg-navy text-white w-full py-3 border-4 border-black shadow-neo font-[900] italic text-xl uppercase tracking-tighter">
                   UNIT {item.unitNo}
                 </div>
                 {/* ✅ GAMBAR DENGAN FALLBACK */}
                 <div className="w-full aspect-square border-4 border-black bg-white shadow-neo overflow-hidden">
                    <img 
                      src={item.photoUrl} 
                      className="w-full h-full object-cover hover:scale-110 transition-transform cursor-zoom-in" 
                      alt="Bukti Kerusakan"
                      onError={(e: any) => {
                        e.target.src = "https://placehold.co/400x400?text=FOTO+RUSAK";
                      }}
                    />
                 </div>
                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Reporter: {item.tenantName}</p>
              </div>

              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4 text-gray-400">
                    <Clock size={14} />
                    <span className="text-[10px] font-black uppercase italic">
                      {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                    </span>
                  </div>
                  <h4 className="text-2xl font-[900] uppercase italic leading-tight text-navy mb-6 pr-20">
                    "{item.description}"
                  </h4>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                  <div className="flex gap-2">
                    <div className={`px-4 py-1 border-4 border-black font-[900] text-[10px] shadow-[4px_4px_0px_#000] uppercase italic 
                      ${item.status === 'pending' ? 'bg-yellow-300' : item.status === 'process' ? 'bg-blue-400' : 'bg-green-400'}`}>
                      STATUS: {item.status}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 min-w-[200px]">
                    {item.status === 'pending' && (
                      <NeoButton 
                        variant="gold" 
                        className="w-full py-3 text-xs flex items-center justify-center gap-2"
                        onClick={() => updateTicketStatus(item.id, 'process')}
                      >
                        <Wrench size={16} /> TUGASKAN TEKNISI
                      </NeoButton>
                    )}

                    {item.status === 'process' && (
                      <div className="space-y-2">
                        <div className="bg-blue-100 border-2 border-blue-500 p-2 text-[9px] font-black text-blue-700 uppercase text-center animate-pulse">
                          Teknisi Sedang Di Lokasi...
                        </div>
                        <NeoButton 
                          className="w-full py-3 text-xs bg-green-500 text-black flex items-center justify-center gap-2"
                          onClick={() => updateTicketStatus(item.id, 'completed')}
                        >
                          <CheckCircle2 size={16} /> TANDAI SELESAI
                        </NeoButton>
                      </div>
                    )}

                    {item.status === 'completed' && (
                      <div className="bg-green-100 border-4 border-black p-4 shadow-[4px_4px_0px_#000] flex items-center justify-center gap-2">
                         <CheckCircle2 className="text-green-600" size={20} strokeWidth={3} />
                         <span className="font-[900] text-xs uppercase italic">TERATASI</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </NeoCard>
          )) : (
            <div className="py-40 text-center border-8 border-dashed border-gray-200">
               <AlertTriangle className="mx-auto mb-4 text-gray-200" size={64} />
               <p className="font-[900] text-4xl text-gray-200 uppercase italic">All Clean! No Complaints.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};