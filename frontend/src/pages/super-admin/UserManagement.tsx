import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, doc, updateDoc } from 'firebase/firestore';
import { NeoCard, NeoButton, NeoInput } from '../../components/ui/NeoUI';
import { Mail, ShieldCheck, ShieldAlert, Search, Ban, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const updateStatus = async (userId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { 
        status: newStatus,
        faceIdActive: newStatus === 'approved'
      });
      toast.success("STATUS UPDATED!");
      setSelectedUser(null);
    } catch (e) {
      toast.error("Gagal simpan");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-end gap-6 border-b-8 border-black pb-8">
        <div>
           <h3 className="text-6xl font-[900] uppercase italic tracking-tighter text-navy leading-none">Global Users.</h3>
           <p className="font-black text-gray-400 uppercase text-xs italic mt-2">Monitoring Akun Gmail & Keamanan Biometrik</p>
        </div>
        <NeoInput 
          placeholder="Cari Email User..." 
          className="mb-0 w-80 bg-white" 
          value={search}
          onChange={(e:any) => setSearch(e.target.value)}
        />
      </div>

      <NeoCard className="p-0 overflow-hidden border-[6px]">
        <table className="w-full text-left">
          <thead className="bg-navy text-white border-b-4 border-black font-black uppercase text-[10px]">
            <tr>
              <th className="p-5 italic">User Account</th>
              <th className="p-5 italic">Security Status</th>
              <th className="p-5 italic">Device ID</th>
              <th className="p-5 text-center italic">Account Control</th>
            </tr>
          </thead>
          <tbody className="font-bold">
            {users.filter(u => u.email?.includes(search)).map((user) => (
              <tr key={user.id} className="border-b-4 border-black hover:bg-gray-50">
                <td className="p-5 italic flex items-center gap-3">
                  <div className="bg-gray-200 p-2 border-2 border-black shadow-[2px_2px_0px_#000]">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="font-black uppercase leading-none">
                      {user.full_name || user.fullName || "Akun Gmail"}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">{user.email}</p>
                  </div>
                </td>
                <td className="p-5">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 border-2 border-black font-black text-[10px] uppercase shadow-neo 
                    ${user.faceIdActive ? 'bg-green-400' : 'bg-gray-200 opacity-50'}`}>
                    {user.faceIdActive ? <ShieldCheck size={12}/> : <ShieldAlert size={12}/>}
                    {user.faceIdActive ? 'Face ID Active' : 'Face ID Inactive'}
                  </div>
                </td>
                <td className="p-5 text-[10px] text-gray-400 font-mono uppercase">
                  {user.deviceId || 'Unknown-Device'}
                </td>
                <td className="p-5 text-center">
                  {user.status === 'approved' ? (
                    <span className="text-green-600 font-black italic">✓ VERIFIED</span>
                  ) : (
                    <NeoButton 
                      variant="gold" 
                      className="py-2 px-4 text-[10px]" 
                      onClick={() => setSelectedUser(user)}
                    >
                      REVIEW KYC
                    </NeoButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </NeoCard>

      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/90 backdrop-blur-sm p-4">
          <NeoCard className="w-full max-w-5xl bg-white relative animate-in zoom-in-95 p-0 overflow-hidden border-[6px]">
            <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 bg-red-500 text-white p-2 border-4 border-black shadow-neo z-10">
              <X />
            </button>
            
            <div className="bg-gold p-6 border-b-4 border-black">
              <h3 className="text-3xl font-[900] uppercase italic tracking-tighter">
                Review Identitas: {selectedUser.full_name}
              </h3>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* INFO TEXT */}
              <div className="bg-gray-100 p-6 border-4 border-black shadow-neo text-black space-y-4">
                <h4 className="font-black border-b-2 border-black pb-2 uppercase text-sm">Data Terdaftar</h4>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Nama Lengkap</p>
                  <p className="font-black italic text-lg">{selectedUser.full_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Email</p>
                  <p className="font-bold underline">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">No. WhatsApp</p>
                  <p className="font-black text-navy">{selectedUser.phone || "Tidak Ada Data HP"}</p>
                </div>
              </div>

              {/* KTP IMAGE */}
              <div className="space-y-2 text-black">
                <p className="font-black uppercase text-[10px] bg-navy text-white px-2 inline-block border-2 border-black">1. Foto KTP</p>
                <div className="border-4 border-black aspect-video overflow-hidden shadow-neo bg-gray-200">
                  <img 
                    src={selectedUser.ktp_base64} 
                    className="w-full h-full object-cover" 
                    alt="KTP" 
                    onError={(e:any) => e.target.src = "https://placehold.co/400x250?text=KTP+TIDAK+ADA"} 
                  />
                </div>
              </div>

              {/* FACE IMAGE */}
              <div className="space-y-2 text-black">
                <p className="font-black uppercase text-[10px] bg-navy text-white px-2 inline-block border-2 border-black">2. Foto Wajah</p>
                <div className="border-4 border-black aspect-video overflow-hidden shadow-neo bg-gray-200">
                  <img 
                    src={selectedUser.face_base64} 
                    className="w-full h-full object-cover" 
                    alt="Selfie"
                    onError={(e:any) => e.target.src = "https://placehold.co/400x250?text=WAJAH+TIDAK+ADA"} 
                  />
                </div>
              </div>
            </div>

            <div className="p-8 pt-0 flex gap-4">
              <NeoButton onClick={() => updateStatus(selectedUser.id, 'approved')} className="flex-1 bg-green-500 text-black py-4">
                SETUJUI (APPROVE)
              </NeoButton>
              <NeoButton onClick={() => updateStatus(selectedUser.id, 'rejected')} variant="white" className="flex-1 border-red-500 text-red-500">
                TOLAK
              </NeoButton>
            </div>
          </NeoCard>
        </div>
      )}
    </div>
  );
};