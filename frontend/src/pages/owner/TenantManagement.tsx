import { useEffect, useState } from 'react';
import { db, auth } from '../../firebase';
import { 
  collection, query, where, onSnapshot, doc, 
  updateDoc, addDoc, serverTimestamp, deleteDoc 
} from 'firebase/firestore';
import { api } from '../../api';
import { NeoCard, NeoButton, NeoInput } from '../../components/ui/NeoUI';
import { 
  Clock, ShieldCheck, X, Eye, 
  CheckCircle2, Edit3, Trash2, User, Mail, Phone, Calendar, Home, Image, UserCheck 
} from 'lucide-react';
import toast from 'react-hot-toast';

export const TenantManagement = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'renewal'>('pending');
  const [bookings, setBookings] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [renewals, setRenewals] = useState<any[]>([]);
  const [renewalLoading, setRenewalLoading] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [showResidentModal, setShowResidentModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const ownerEmail = auth.currentUser?.email;
    if (!ownerEmail) return;

    const qPending = query(
      collection(db, "bookings"), 
      where("ownerEmail", "==", ownerEmail), 
      where("status", "==", "pending")
    );
    const unsubPending = onSnapshot(qPending, (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qActive = query(
      collection(db, "units"), 
      where("ownerEmail", "==", ownerEmail), 
      where("status", "==", "Occupied")
    );
    const unsubActive = onSnapshot(qActive, (snap) => {
      setResidents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qRenewal = query(
      collection(db, "renewal_requests"),
      where("ownerEmail", "==", ownerEmail),
      where("status", "==", "pending")
    );
    const unsubRenewal = onSnapshot(qRenewal, (snap) => {
      setRenewals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { 
      unsubPending(); 
      unsubActive(); 
      unsubRenewal(); 
    };
  }, []);

  const handleViewResident = (resident: any) => {
    setSelectedResident(resident);
    setEditData({
      tenantName: resident.tenantName || '',
      tenantEmail: resident.tenantEmail || '',
      tenantPhone: resident.tenantPhone || '',
    });
    setEditMode(false);
    setShowResidentModal(true);
  };

  const handleEditResident = () => setEditMode(true);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateResident = async () => {
    if (!selectedResident) return;
    setIsUpdating(true);
    try {
      const unitRef = doc(db, "units", selectedResident.id);
      await updateDoc(unitRef, {
        tenantName: editData.tenantName,
        tenantEmail: editData.tenantEmail,
        tenantPhone: editData.tenantPhone,
      });
      toast.success("Data penghuni berhasil diperbarui!", {
        style: { border: '4px solid black', padding: '16px', fontWeight: '900', borderRadius: '0px', boxShadow: '4px 4px 0px 0px #000' },
      });
      setEditMode(false);
      setSelectedResident((prev: any) => ({ ...prev, ...editData }));
    } catch (err: any) {
      toast.error("Gagal update: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteResident = async () => {
    if (!selectedResident) return;
    if (!window.confirm(`Yakin ingin menghapus penghuni ${selectedResident.tenantName} dari unit ${selectedResident.unitNo}?`)) return;

    try {
      const unitRef = doc(db, "units", selectedResident.id);
      await updateDoc(unitRef, {
        status: 'Vacant',
        tenantName: '',
        tenantEmail: '',
        tenantPhone: '',
        ktpUrl: '',
        selfieUrl: '',
        leaseStart: '',
        leaseEnd: '',
        durationMonths: 0,
      });
      toast.success("Penghuni berhasil dihapus!", {
        style: { border: '4px solid black', padding: '16px', fontWeight: '900', borderRadius: '0px', boxShadow: '4px 4px 0px 0px #000' },
      });
      setShowResidentModal(false);
      setSelectedResident(null);
    } catch (err: any) {
      toast.error("Gagal hapus: " + err.message);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) {
      toast.error("Tidak ada permohonan yang dipilih!", {
        style: { border: '4px solid black', padding: '16px', fontWeight: '900', borderRadius: '0px', boxShadow: '4px 4px 0px 0px #000' },
      });
      return;
    }
    if (!selectedRequest.id) {
      toast.error("DATA ERROR: ID Booking tidak ditemukan!", {
        style: { border: '4px solid black', padding: '16px', fontWeight: '900', borderRadius: '0px', boxShadow: '4px 4px 0px 0px #000' },
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/owner/approve-booking', {
        booking_id: selectedRequest.id,
      });
      console.log("✅ Approve booking success:", response.data);
      toast.success("✅ VERIFIKASI SUKSES! Tenant resmi jadi penghuni.", {
        style: { border: '4px solid black', padding: '16px', fontWeight: '900', borderRadius: '0px', boxShadow: '4px 4px 0px 0px #000' },
      });
      setSelectedRequest(null);
    } catch (err: any) {
      console.error("❌ ERROR:", err);
      const detailMessage = err.response?.data?.detail || err.message || "Terjadi kesalahan tidak diketahui.";
      toast.error("Gagal: " + detailMessage, {
        style: { border: '4px solid black', padding: '16px', fontWeight: '900', borderRadius: '0px', boxShadow: '4px 4px 0px 0px #000' },
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // 🔥 APPROVE RENEWAL — panggil backend
  // ============================================================
  const handleApproveRenewal = async (req: any) => {
    setRenewalLoading(req.id);
    try {
      const response = await api.post('/owner/approve-renewal', {
        renewal_id: req.id,
      });
      toast.success(`Perpanjangan disetujui! ${response.data.bills_created} tagihan dibuat.`, {
        style: { border: '4px solid black', padding: '16px', fontWeight: '900', borderRadius: '0px', boxShadow: '4px 4px 0px 0px #000' },
      });
    } catch (err: any) {
      const detailMessage = err.response?.data?.detail || err.message || "Terjadi kesalahan tidak diketahui.";
      toast.error("Gagal approve: " + detailMessage, {
        style: { border: '4px solid black', padding: '16px', fontWeight: '900', borderRadius: '0px', boxShadow: '4px 4px 0px 0px #000' },
      });
    } finally {
      setRenewalLoading(null);
    }
  };

  const handleRejectRenewal = async (req: any) => {
    if (!window.confirm(`Tolak pengajuan perpanjangan dari ${req.tenantName}?`)) return;
    setRenewalLoading(req.id);
    try {
      await updateDoc(doc(db, "renewal_requests", req.id), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "notifications"), {
        userEmail: req.tenantEmail,
        title: "Pengajuan Perpanjangan Ditolak",
        desc: `Pengajuan perpanjangan kontrak untuk unit #${req.unitNo} tidak dapat disetujui. Silakan hubungi owner untuk info lebih lanjut.`,
        type: "approval",
        isRead: false,
        createdAt: serverTimestamp(),
      });

      toast.success("Pengajuan ditolak.", {
        style: { border: '4px solid black', padding: '16px', fontWeight: '900', borderRadius: '0px', boxShadow: '4px 4px 0px 0px #000' },
      });
    } catch (err: any) {
      toast.error("Gagal reject: " + err.message);
    } finally {
      setRenewalLoading(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col lg:flex-row justify-between items-end gap-6 border-b-8 border-black pb-4">
        <div>
          <h3 className="text-6xl font-[900] uppercase italic tracking-tighter text-navy leading-none">Resident Center.</h3>
          <div className="flex gap-4 mt-6">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-2 border-4 border-black font-black uppercase text-xs transition-all shadow-neo 
              ${activeTab === 'pending' ? 'bg-gold translate-x-1 translate-y-1 shadow-none' : 'bg-white hover:bg-gray-100'}`}
            >
              Antrian Booking ({bookings.length})
            </button>
            <button 
              onClick={() => setActiveTab('active')}
              className={`px-6 py-2 border-4 border-black font-black uppercase text-xs transition-all shadow-neo 
              ${activeTab === 'active' ? 'bg-navy text-white translate-x-1 translate-y-1 shadow-none' : 'bg-white text-black hover:bg-gray-100'}`}
            >
              Penghuni Aktif ({residents.length})
            </button>
            <button 
              onClick={() => setActiveTab('renewal')}
              className={`px-6 py-2 border-4 border-black font-black uppercase text-xs transition-all shadow-neo 
              ${activeTab === 'renewal' ? 'bg-green-500 text-white translate-x-1 translate-y-1 shadow-none' : 'bg-white text-black hover:bg-gray-100'}`}
            >
              Pengajuan Perpanjangan ({renewals.length})
            </button>
          </div>
        </div>
      </div>

      {/* PENDING */}
      {activeTab === 'pending' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((req) => (
            <NeoCard key={req.id} className="relative bg-white border-4 flex flex-col justify-between">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-navy p-3 border-2 border-black text-gold shadow-neo">
                   <Clock size={24} />
                </div>
                <div>
                   <p className="font-[900] uppercase italic text-lg leading-none">{req.userName}</p>
                   <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest italic">Unit #{req.unitNo}</p>
                </div>
              </div>
              <NeoButton onClick={() => setSelectedRequest(req)} variant="gold" className="w-full py-2 text-xs">
                LIHAT BERKAS KTP & WAJAH
              </NeoButton>
            </NeoCard>
          ))}
          {bookings.length === 0 && (
            <div className="col-span-full py-20 text-center border-4 border-dashed border-gray-200">
               <p className="font-black text-gray-300 uppercase italic text-2xl">Tidak ada antrian booking baru</p>
            </div>
          )}
        </div>
      )}

      {/* ACTIVE */}
      {activeTab === 'active' && (
        <NeoCard className="p-0 overflow-hidden border-[6px]">
          <table className="w-full text-left">
            <thead className="bg-navy text-white border-b-4 border-black font-black uppercase text-[10px]">
              <tr>
                <th className="p-5 italic">Unit & Nama</th>
                <th className="p-5 italic">Kontak Gmail</th>
                <th className="p-5 italic">Status Keamanan</th>
                <th className="p-5 text-center italic">Detail</th>
              </tr>
            </thead>
            <tbody className="font-bold">
              {residents.map((res) => (
                <tr key={res.id} className="border-b-4 border-black hover:bg-gray-50">
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                       <span className="bg-gold border-2 border-black px-2 py-1 text-xs italic shadow-[2px_2px_0px_#000]">#{res.unitNo}</span>
                       <p className="uppercase font-[900]">{res.tenantName}</p>
                    </div>
                  </td>
                  <td className="p-5">
                    <p className="text-xs uppercase italic underline">{res.tenantEmail || res.tenant_email}</p>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-1 text-green-600 font-black text-[9px] uppercase">
                       <ShieldCheck size={12} /> Verified Identity
                    </div>
                  </td>
                  <td className="p-5 text-center">
                    <NeoButton 
                      variant="white" 
                      className="p-2 border-2"
                      onClick={() => handleViewResident(res)}
                    >
                      <Eye size={16} />
                    </NeoButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </NeoCard>
      )}

      {/* RENEWAL */}
      {activeTab === 'renewal' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renewals.map((req) => (
            <NeoCard key={req.id} className="relative bg-white border-4 flex flex-col justify-between">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-green-500 p-3 border-2 border-black text-white shadow-neo">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="font-[900] uppercase italic text-lg leading-none">{req.tenantName}</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest italic">Unit #{req.unitNo}</p>
                </div>
              </div>
              <div className="text-xs font-bold space-y-1 mb-4 border-t-2 border-black pt-3">
                <p>Kontrak Berakhir: <span className="font-black">{req.currentLeaseEnd ? new Date(req.currentLeaseEnd).toLocaleDateString() : '-'}</span></p>
                <p>Minta Perpanjangan: <span className="font-black">{req.requestedDuration} {req.rentalType === 'harian' ? 'hari' : req.rentalType === 'mingguan' ? 'minggu' : 'bulan'}</span></p>
              </div>
              <div className="flex gap-2">
                <NeoButton
                  onClick={() => handleApproveRenewal(req)}
                  variant="gold"
                  disabled={renewalLoading === req.id}
                  className="flex-1 py-2 text-xs"
                >
                  {renewalLoading === req.id ? '...' : 'Setujui'}
                </NeoButton>
                <NeoButton
                  onClick={() => handleRejectRenewal(req)}
                  variant="white"
                  disabled={renewalLoading === req.id}
                  className="flex-1 py-2 text-xs border-2 border-red-500 text-red-600"
                >
                  Tolak
                </NeoButton>
              </div>
            </NeoCard>
          ))}
          {renewals.length === 0 && (
            <div className="col-span-full py-20 text-center border-4 border-dashed border-gray-200">
              <p className="font-black text-gray-300 uppercase italic text-2xl">Tidak ada pengajuan perpanjangan</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL DETAIL */}
      {showResidentModal && selectedResident && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/90 backdrop-blur-sm p-4">
          <NeoCard className="w-full max-w-3xl bg-white relative animate-in zoom-in-95 overflow-y-auto max-h-[90vh] p-8 border-[6px]">
            <button 
              onClick={() => { setShowResidentModal(false); setSelectedResident(null); setEditMode(false); }} 
              className="absolute top-4 right-4 bg-red-500 text-white p-2 border-4 border-black shadow-neo hover:translate-x-1 transition-all"
            >
              <X size={24} strokeWidth={4} />
            </button>

            <h3 className="text-3xl font-[900] uppercase italic border-b-4 border-black pb-4 mb-6">
              Detail <span className="text-gold">Penghuni</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* ... konten detail ... */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Home size={18} />
                  <span className="font-bold text-sm">Unit:</span>
                  <span className="font-black text-lg">{selectedResident.unitNo}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <User size={18} />
                  <span className="font-bold text-sm">Nama:</span>
                  {editMode ? (
                    <NeoInput 
                      name="tenantName"
                      value={editData.tenantName}
                      onChange={handleEditChange}
                      className="border-2 border-black p-1 text-sm w-full"
                    />
                  ) : (
                    <span className="font-black text-lg">{selectedResident.tenantName}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={18} />
                  <span className="font-bold text-sm">Email:</span>
                  {editMode ? (
                    <NeoInput 
                      name="tenantEmail"
                      value={editData.tenantEmail}
                      onChange={handleEditChange}
                      className="border-2 border-black p-1 text-sm w-full"
                    />
                  ) : (
                    <span className="font-black text-sm">{selectedResident.tenantEmail}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={18} />
                  <span className="font-bold text-sm">Telepon:</span>
                  {editMode ? (
                    <NeoInput 
                      name="tenantPhone"
                      value={editData.tenantPhone}
                      onChange={handleEditChange}
                      className="border-2 border-black p-1 text-sm w-full"
                    />
                  ) : (
                    <span className="font-black text-sm">{selectedResident.tenantPhone || '-'}</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={18} />
                  <span className="font-bold text-sm">Mulai Sewa:</span>
                  <span className="font-black text-sm">{selectedResident.leaseStart ? new Date(selectedResident.leaseStart).toLocaleDateString() : '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={18} />
                  <span className="font-bold text-sm">Berakhir Sewa:</span>
                  <span className="font-black text-sm">{selectedResident.leaseEnd ? new Date(selectedResident.leaseEnd).toLocaleDateString() : '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <ShieldCheck size={18} />
                  <span className="font-bold text-sm">Durasi:</span>
                  <span className="font-black text-sm">{selectedResident.durationMonths || 0} bulan</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <UserCheck size={18} />
                  <span className="font-bold text-sm">Tipe Sewa:</span>
                  <span className="font-black text-sm">{selectedResident.rentalType || 'bulanan'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {selectedResident.ktpUrl && (
                <div>
                  <p className="font-black uppercase text-xs italic text-navy mb-2">Foto KTP</p>
                  <div className="border-4 border-black bg-gray-100 overflow-hidden shadow-neo group">
                    <img src={selectedResident.ktpUrl} className="w-full aspect-[3/2] object-cover group-hover:scale-110 transition-transform" alt="KTP"/>
                  </div>
                </div>
              )}
              {selectedResident.selfieUrl && (
                <div>
                  <p className="font-black uppercase text-xs italic text-navy mb-2">Foto Selfie</p>
                  <div className="border-4 border-black bg-gray-100 overflow-hidden shadow-neo group">
                    <img src={selectedResident.selfieUrl} className="w-full aspect-[3/2] object-cover group-hover:scale-110 transition-transform" alt="Selfie"/>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t-4 border-black pt-6">
              <div className="flex gap-3">
                {editMode ? (
                  <>
                    <NeoButton 
                      variant="gold" 
                      className="px-6 py-2 text-sm flex items-center gap-2"
                      onClick={handleUpdateResident}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </NeoButton>
                    <NeoButton 
                      variant="white" 
                      className="px-6 py-2 text-sm border-2 border-black"
                      onClick={() => setEditMode(false)}
                    >
                      Batal
                    </NeoButton>
                  </>
                ) : (
                  <>
                    <NeoButton 
                      variant="gold" 
                      className="px-6 py-2 text-sm flex items-center gap-2"
                      onClick={handleEditResident}
                    >
                      <Edit3 size={16} /> Edit
                    </NeoButton>
                    <NeoButton 
                      variant="white" 
                      className="px-6 py-2 text-sm border-2 border-red-500 text-red-600 flex items-center gap-2"
                      onClick={handleDeleteResident}
                    >
                      <Trash2 size={16} /> Hapus
                    </NeoButton>
                  </>
                )}
              </div>
              <NeoButton 
                variant="navy" 
                className="px-6 py-2 text-sm text-white"
                onClick={() => { setShowResidentModal(false); setSelectedResident(null); setEditMode(false); }}
              >
                Tutup
              </NeoButton>
            </div>
          </NeoCard>
        </div>
      )}

      {/* MODAL APPROVE BOOKING */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/90 backdrop-blur-sm p-4">
          <NeoCard className="w-full max-w-4xl bg-white relative animate-in zoom-in-95 overflow-y-auto max-h-[90vh] p-10">
            <button onClick={() => setSelectedRequest(null)} className="absolute top-4 right-4 bg-red-500 text-white p-2 border-4 border-black shadow-neo hover:translate-x-1 transition-all"><X size={24} strokeWidth={4}/></button>
            
            <h3 className="text-4xl font-[900] uppercase italic border-b-4 border-black pb-4 mb-8">
              Review <span className="text-gold">Identity.</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
              <div className="space-y-4">
                <p className="font-black uppercase text-sm italic bg-navy text-white px-3 py-1 inline-block border-2 border-black shadow-neo">1. Foto KTP Asli</p>
                <div className="border-4 border-black bg-gray-100 overflow-hidden shadow-neo group">
                  <img src={selectedRequest.ktpUrl} className="w-full aspect-[3/2] object-cover group-hover:scale-110 transition-transform" alt="KTP"/>
                </div>
              </div>

              <div className="space-y-4">
                <p className="font-black uppercase text-sm italic bg-gold text-black px-3 py-1 inline-block border-2 border-black shadow-neo">2. Foto Wajah (Selfie)</p>
                <div className="border-4 border-black bg-gray-100 overflow-hidden shadow-neo group">
                  <img src={selectedRequest.selfieUrl} className="w-full aspect-[3/2] object-cover group-hover:scale-110 transition-transform" alt="Wajah"/>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 p-8 border-4 border-black shadow-neo flex flex-col md:flex-row justify-between items-center gap-6">
               <div>
                  <p className="font-black text-xs uppercase text-gray-400 italic leading-none">Sedang meninjau permintaan untuk:</p>
                  <p className="text-2xl font-[900] uppercase italic text-navy">Unit #{selectedRequest.unitNo} - {selectedRequest.userName}</p>
               </div>
               <NeoButton 
                 onClick={handleApprove} 
                 variant="gold" 
                 disabled={loading}
                 className="py-5 px-10 text-xl flex items-center gap-3"
               >
                 {loading ? "PROCESSING..." : "APPROVE & GRANT ACCESS"} <CheckCircle2 />
               </NeoButton>
            </div>
          </NeoCard>
        </div>
      )}

    </div>
  );
};