import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { NeoCard, NeoButton, NeoInput } from '../../components/ui/NeoUI';
import { Trash2, Building, Mail, UserPlus, X, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export const OwnerManagement = () => {
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ fullName: '', email: '', buildingName: '' });

  const fetchOwners = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "owners"));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setOwners(data);
    setLoading(false);
  };

  useEffect(() => { fetchOwners(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateDoc(doc(db, "owners", editId), formData);
        toast.success('Data Owner Berhasil Diperbarui!', {
          style: {
            border: '4px solid black',
            padding: '16px',
            fontWeight: '900',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
          },
        });
      } else {
        await addDoc(collection(db, "owners"), formData);
        toast.success('Owner Baru Berhasil Ditambahkan!', {
          style: {
            border: '4px solid black',
            padding: '16px',
            fontWeight: '900',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
          },
        });
      }
      closeModal();
      fetchOwners();
    } catch (err) { 
      toast.error('Gagal menyimpan data!', {
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

  const handleDelete = async (id: string) => {
    if (window.confirm("PERINGATAN: Hapus akses owner ini secara permanen?")) {
      try {
        await deleteDoc(doc(db, "owners", id));
        toast.success('Owner berhasil dihapus!', {
          style: {
            border: '4px solid black',
            padding: '16px',
            fontWeight: '900',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
          },
        });
        fetchOwners();
      } catch (err) {
        toast.error('Gagal menghapus owner!', {
          style: {
            border: '4px solid black',
            padding: '16px',
            fontWeight: '900',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
          },
        });
      }
    }
  };

  const openModal = (owner?: any) => {
    if (owner) {
      setEditId(owner.id);
      setFormData({ fullName: owner.fullName, email: owner.email, buildingName: owner.buildingName });
    } else {
      setEditId(null);
      setFormData({ fullName: '', email: '', buildingName: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ fullName: '', email: '', buildingName: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b-8 border-black pb-8">
        <div>
           <h3 className="text-6xl font-[900] uppercase italic tracking-tighter leading-none">Owner List.</h3>
           <p className="font-black text-gray-400 uppercase text-xs italic tracking-[0.2em] mt-2">Database Management / {owners.length} Terdaftar</p>
        </div>
        <NeoButton onClick={() => openModal()} variant="gold" className="flex items-center gap-2 shadow-[8px_8px_0px_0px_#000]">
          <UserPlus size={20}/> Tambah Owner Baru
        </NeoButton>
      </div>

      {loading ? (
        <p className="font-black italic uppercase text-center py-20 text-gray-300">Loading Database...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {owners.map((owner) => (
            <NeoCard key={owner.id} className="relative group hover:rotate-1 transition-transform">
              <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => openModal(owner)} className="bg-white border-4 border-black p-2 shadow-neo hover:bg-gold"><Edit3 size={16}/></button>
                  <button onClick={() => handleDelete(owner.id)} className="bg-red-500 text-white border-4 border-black p-2 shadow-neo hover:bg-red-700">
                    <Trash2 size={16} />
                  </button>
              </div>
              <h4 className="text-2xl font-[900] uppercase italic tracking-tighter leading-none mb-1 pr-20">{owner.fullName}</h4>
              <p className="text-xs font-bold text-gray-400 mb-6 italic underline">{owner.email}</p>
              <div className="bg-gray-100 border-4 border-black p-4 shadow-neo flex items-center gap-4">
                 <Building size={24} className="text-navy" />
                 <p className="font-[900] uppercase italic text-sm">{owner.buildingName}</p>
              </div>
            </NeoCard>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/80 backdrop-blur-sm p-4">
          <NeoCard className="w-full max-w-lg bg-white relative animate-in zoom-in-95 duration-200">
            <button onClick={closeModal} className="absolute -top-4 -right-4 bg-red-500 text-white p-2 border-4 border-black shadow-neo">
              <X size={24} strokeWidth={4} />
            </button>
            
            <h3 className="text-3xl font-[900] uppercase italic border-b-4 border-black pb-4 mb-6">
              {editId ? 'Edit Data Owner' : 'Daftarkan Owner'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <NeoInput 
                label="Full Name" 
                value={formData.fullName} 
                onChange={(e:any) => setFormData({...formData, fullName: e.target.value})} 
                required 
              />
              <NeoInput 
                label="Email Address" 
                type="email" 
                value={formData.email} 
                onChange={(e:any) => setFormData({...formData, email: e.target.value})} 
                required 
              />
              <NeoInput 
                label="Building Name" 
                value={formData.buildingName} 
                onChange={(e:any) => setFormData({...formData, buildingName: e.target.value})} 
                required 
              />
              
              <div className="pt-4">
                <NeoButton className="w-full py-4 flex items-center justify-center gap-2" variant="navy">
                  <Save size={20} /> {editId ? 'Simpan Perubahan' : 'Daftarkan Sekarang'}
                </NeoButton>
              </div>
            </form>
          </NeoCard>
        </div>
      )}
    </div>
  );
};