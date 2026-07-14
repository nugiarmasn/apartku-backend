import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { 
  collection, addDoc, query, where, onSnapshot, 
  doc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { NeoCard, NeoButton, NeoInput } from '../../components/ui/NeoUI';
import { 
  Plus, Building2, X, Banknote, Edit3, 
  Trash2, Save, Layers, User, LayoutGrid, ImageIcon, Loader2, Zap,
  Search, Phone, Wrench, Receipt, AlertTriangle, Clock, Home
} from 'lucide-react';
import toast from 'react-hot-toast';

const calculateDaysLeft = (endDate: string) => {
  if (!endDate) return 0;
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays > 0 ? diffDays : 0;
};

const LegendItem = ({ color, label }: { color: string, label: string }) => (
  <div className="flex items-center gap-2">
    <div className={`w-4 h-4 border-2 border-black ${color}`}></div>
    <span className="text-[10px] font-bold uppercase italic">{label}</span>
  </div>
);

export const UnitManagement = () => {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedBld, setSelectedBld] = useState<any>(null); 
  const [loading, setLoading] = useState(false);
  
  const [showBldModal, setShowBldModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editBldId, setEditBldId] = useState<string | null>(null);
  const [editUnitId, setEditUnitId] = useState<string | null>(null);
  
  const [newBld, setNewBld] = useState({
    name: '',
    tier: 'Standar',
    photoUrl: '',
    address: '',
    city: '',
    whatsapp: '',
    phone: '',
    email: '',
    operationalHours: 'Senin-Sabtu 08.00-17.00'
  });
  
  const availableAmenities = ["AC", "Kasur", "Lemari", "Sofa", "TV", "Kitchen Set", "Kamar Mandi", "Water Heater", "Wifi"];
  
  const [unitImage, setUnitImage] = useState<string>("");

  const [newUnit, setNewUnit] = useState({ 
    no: '', 
    floor: '', 
    tier: 'Standar', 
    price: '',
    priceDaily: '',
    priceWeekly: '',
    status: 'Vacant',
    tenantName: '',
    amenities: [] as string[],
    unitPhoto: ''
  });

  const [bulkData, setBulkData] = useState({ 
    startNo: 101, 
    endNo: 110, 
    floor: '', 
    tier: 'Standar', 
    price: '',
    priceDaily: '',
    priceWeekly: '',
    amenities: [] as string[],
    unitPhoto: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFloor, setActiveFloor] = useState('Semua');
  const [typeFilter, setTypeFilter] = useState('Semua');
  const [showQuickAction, setShowQuickAction] = useState<any>(null);

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewBld({ ...newBld, photoUrl: reader.result as string });
        toast.success('Foto berhasil dipilih!', {
          style: {
            border: '4px solid black',
            padding: '16px',
            fontWeight: '900',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUnitFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setUnitImage(base64);
        setNewUnit({ ...newUnit, unitPhoto: base64 });
        setBulkData({ ...bulkData, unitPhoto: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const userEmail = auth.currentUser?.email;
    if (!userEmail) return;

    const q = query(collection(db, "buildings"), where("ownerEmail", "==", userEmail));
    const unsubscribe = onSnapshot(q, (snap) => {
      const bldData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBuildings(bldData);
      
      if (bldData.length > 0 && !selectedBld) {
        setSelectedBld(bldData[0]);
      }
    });
    return () => unsubscribe();
  }, [selectedBld]);

  useEffect(() => {
    if (!selectedBld?.id) {
      setUnits([]);
      return;
    }

    const q = query(collection(db, "units"), where("buildingId", "==", selectedBld.id));
    const unsubscribe = onSnapshot(q, (snap) => {
      setUnits(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [selectedBld]);

  const toggleAmenity = (name: string) => {
    setNewUnit(prev => ({
      ...prev,
      amenities: prev.amenities.includes(name) 
        ? prev.amenities.filter(a => a !== name) 
        : [...prev.amenities, name]
    }));
  };

  const handleSaveBuilding = async (e: any) => {
    e.preventDefault();
    try {
      let photoUrl = newBld.photoUrl || "https://placehold.co/600x400?text=No+Image";

      if (editBldId) {
        await updateDoc(doc(db, "buildings", editBldId), {
          name: newBld.name,
          tier: newBld.tier,
          photoUrl: photoUrl,
          address: newBld.address,
          city: newBld.city,
          whatsapp: newBld.whatsapp,
          phone: newBld.phone,
          email: newBld.email,
          operationalHours: newBld.operationalHours
        });
        toast.success('Gedung berhasil diperbarui!', {
          style: {
            border: '4px solid black',
            padding: '16px',
            fontWeight: '900',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
          },
        });
      } else {
        await addDoc(collection(db, "buildings"), {
          name: newBld.name,
          tier: newBld.tier,
          photoUrl: photoUrl,
          address: newBld.address,
          city: newBld.city,
          whatsapp: newBld.whatsapp,
          phone: newBld.phone,
          email: newBld.email || auth.currentUser?.email,
          operationalHours: newBld.operationalHours || 'Senin-Sabtu 08.00-17.00',
          ownerEmail: auth.currentUser?.email,
          createdAt: new Date()
        });
        toast.success('Gedung baru berhasil ditambahkan!', {
          style: {
            border: '4px solid black',
            padding: '16px',
            fontWeight: '900',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
          },
        });
      }
      
      closeBldModal();
    } catch (err) { 
      toast.error('Gagal simpan gedung!', {
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

  const handleDeleteBuilding = async (id: string, e: any) => {
    e.stopPropagation();
    if (window.confirm("HAPUS GEDUNG? Semua data unit di dalamnya akan hilang.")) {
      try {
        await deleteDoc(doc(db, "buildings", id));
        toast.success('Gedung berhasil dihapus!', {
          style: {
            border: '4px solid black',
            padding: '16px',
            fontWeight: '900',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
          },
        });
        if (selectedBld?.id === id) setSelectedBld(null);
      } catch (err) {
        toast.error('Gagal hapus gedung!', {
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

  const closeBldModal = () => {
    setShowBldModal(false);
    setEditBldId(null);
    setNewBld({
      name: '',
      tier: 'Standar',
      photoUrl: '',
      address: '',
      city: '',
      whatsapp: '',
      phone: '',
      email: '',
      operationalHours: 'Senin-Sabtu 08.00-17.00'
    });
  };

  const handleSaveUnit = async (e: any) => {
    e.preventDefault();

    if (!newUnit.no.trim()) {
      toast.error("Unit Number wajib diisi!", {
        style: { border: '4px solid black', padding: '16px', fontWeight: '900', borderRadius: '0px', boxShadow: '4px 4px 0px 0px #000' },
      });
      return;
    }
    if (!newUnit.floor.trim()) {
      toast.error("Floor wajib diisi!", {
        style: { border: '4px solid black', padding: '16px', fontWeight: '900', borderRadius: '0px', boxShadow: '4px 4px 0px 0px #000' },
      });
      return;
    }

    const priceMonthly = Number(newUnit.price) || 0;
    const priceDaily = Number(newUnit.priceDaily) || 0;
    const priceWeekly = Number(newUnit.priceWeekly) || 0;

    if (priceMonthly <= 0 && priceDaily <= 0 && priceWeekly <= 0) {
      toast.error("Minimal isi salah satu harga: Bulanan, Harian, atau Mingguan!", {
        style: { border: '4px solid black', padding: '16px', fontWeight: '900', borderRadius: '0px', boxShadow: '4px 4px 0px 0px #000' },
      });
      return;
    }

    try {
      const unitData = { 
        ...newUnit,
        unitNo: newUnit.no,
        price: priceMonthly,
        priceDaily: priceDaily,
        priceWeekly: priceWeekly,
        buildingId: selectedBld.id,
        buildingName: selectedBld.name,
        ownerEmail: auth.currentUser?.email,
        amenities: newUnit.amenities,
        unitPhoto: newUnit.unitPhoto || ""
      };

      if (editUnitId) {
        await updateDoc(doc(db, "units", editUnitId), unitData);
        toast.success('Unit berhasil diperbarui!', {
          style: { border: '4px solid black', padding: '16px', fontWeight: '900', borderRadius: '0px', boxShadow: '4px 4px 0px 0px #000' },
        });
      } else {
        await addDoc(collection(db, "units"), { ...unitData, createdAt: new Date() });
        toast.success('Unit baru berhasil ditambahkan!', {
          style: { border: '4px solid black', padding: '16px', fontWeight: '900', borderRadius: '0px', boxShadow: '4px 4px 0px 0px #000' },
        });
      }
      setUnitImage("");
      closeUnitModal();
    } catch (err) { 
      toast.error('Error simpan unit!', {
        style: { border: '4px solid black', padding: '16px', fontWeight: '900', borderRadius: '0px', boxShadow: '4px 4px 0px 0px #000' },
      });
    }
  };

  // 🔥 PERBAIKAN: Bulk Generate dengan validasi minimal salah satu harga diisi
  const generateBulkUnits = async (e: any) => {
    e.preventDefault();

    const priceMonthly = Number(bulkData.price) || 0;
    const priceDaily = Number(bulkData.priceDaily) || 0;
    const priceWeekly = Number(bulkData.priceWeekly) || 0;

    if (priceMonthly <= 0 && priceDaily <= 0 && priceWeekly <= 0) {
      toast.error("Minimal isi salah satu harga: Bulanan, Harian, atau Mingguan!", {
        style: { border: '4px solid black', padding: '16px', fontWeight: '900', borderRadius: '0px', boxShadow: '4px 4px 0px 0px #000' },
      });
      return;
    }

    setLoading(true);
    try {
      const start = Number(bulkData.startNo);
      const end = Number(bulkData.endNo);
      
      for (let i = start; i <= end; i++) {
        await addDoc(collection(db, "units"), {
          unitNo: i.toString(),
          floor: bulkData.floor,
          tier: bulkData.tier,
          price: priceMonthly,
          priceDaily: priceDaily,
          priceWeekly: priceWeekly,
          amenities: bulkData.amenities,
          status: 'Vacant',
          buildingId: selectedBld.id,
          buildingName: selectedBld.name,
          ownerEmail: auth.currentUser?.email,
          unitPhoto: bulkData.unitPhoto || "",
          createdAt: new Date()
        });
      }
      
      setShowBulkModal(false);
      setUnitImage("");
      toast.success(`GOKIL! ${end - start + 1} Unit dengan fasilitas lengkap berhasil dibuat.`);
    } catch (err) {
      toast.error("Gagal buat unit massal!");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (window.confirm("Hapus unit ini?")) {
      try {
        await deleteDoc(doc(db, "units", id));
        toast.success('Unit berhasil dihapus!', {
          style: {
            border: '4px solid black',
            padding: '16px',
            fontWeight: '900',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
          },
        });
      } catch (err) {
        toast.error('Gagal hapus unit!', {
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

  const openEditUnit = (u: any) => {
    setEditUnitId(u.id);
    setNewUnit({ 
      no: u.unitNo || u.no, 
      floor: u.floor, 
      tier: u.tier, 
      price: u.price?.toString() || '',
      priceDaily: u.priceDaily?.toString() || '',
      priceWeekly: u.priceWeekly?.toString() || '',
      status: u.status,
      tenantName: u.tenantName || '',
      amenities: u.amenities || [],
      unitPhoto: u.unitPhoto || ''
    });
    setUnitImage(u.unitPhoto || '');
    setShowUnitModal(true);
  };

  const openEditBuilding = (b: any) => {
    setEditBldId(b.id);
    setNewBld({
      name: b.name,
      tier: b.tier,
      photoUrl: b.photoUrl || '',
      address: b.address || '',
      city: b.city || '',
      whatsapp: b.whatsapp || '',
      phone: b.phone || '',
      email: b.email || b.ownerEmail || '',
      operationalHours: b.operationalHours || 'Senin-Sabtu 08.00-17.00'
    });
    setShowBldModal(true);
  };

  const closeUnitModal = () => {
    setShowUnitModal(false);
    setEditUnitId(null);
    setNewUnit({ 
      no: '', floor: '', tier: selectedBld?.tier || 'Standar', 
      price: '', priceDaily: '', priceWeekly: '',
      status: 'Vacant', tenantName: '', amenities: [], unitPhoto: '' 
    });
    setUnitImage("");
  };

  const floors = ['Semua', ...new Set(units.map(u => u.floor))].sort((a,b) => Number(a) - Number(b));

  const filteredUnits = units.filter(u => {
    const unitNoSafe = (u.unitNo || u.no || '').toString().toLowerCase();
    const tenantNameSafe = (u.tenantName || '').toString().toLowerCase();
    
    const matchSearch = unitNoSafe.includes(searchQuery.toLowerCase()) || 
                        tenantNameSafe.includes(searchQuery.toLowerCase());
    const matchFloor = activeFloor === 'Semua' || u.floor === activeFloor;
    const matchType = typeFilter === 'Semua' || u.tier === typeFilter;
    return matchSearch && matchFloor && matchType;
  });

  const getStatusColor = (u: any) => {
    if (u.status === 'Maintenance' || u.status === 'Cleaning') return 'bg-yellow-400';
    if (u.status === 'Vacant') return 'bg-blue-400';
    if (u.isNunggak || u.hasComplaint) return 'bg-red-400';
    if (u.status === 'Occupied') return 'bg-green-400';
    return 'bg-white';
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      
      <section className="space-y-4">
        <div className="flex justify-between items-end border-b-4 border-black pb-2">
          <h2 className="text-3xl font-[900] uppercase italic tracking-tighter">Your Buildings.</h2>
          <NeoButton onClick={() => setShowBldModal(true)} variant="white" className="py-1 px-4 text-[10px]">
            + REGISTER NEW BUILDING
          </NeoButton>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
          {buildings.map((b) => (
            <div 
              key={b.id} 
              onClick={() => setSelectedBld(b)} 
              className={`min-w-[280px] border-4 border-black cursor-pointer transition-all shadow-neo relative group bg-white hover:bg-gray-50
              ${selectedBld?.id === b.id ? 'bg-gold translate-x-1 translate-y-1 shadow-none' : ''}`}
            >
              <div className="h-32 w-full border-b-4 border-black overflow-hidden bg-gray-200">
                <img src={b.photoUrl || "https://placehold.co/600x400?text=No+Image"} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              </div>
              <div className="p-5">
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={(e) => { e.stopPropagation(); openEditBuilding(b); }} className="bg-white border-2 border-black p-1 hover:bg-navy hover:text-white"><Edit3 size={12}/></button>
                  <button onClick={(e) => handleDeleteBuilding(b.id, e)} className="bg-red-500 text-white border-2 border-black p-1 hover:bg-red-700"><Trash2 size={12}/></button>
                </div>
                <div className="flex justify-between items-start">
                  <Building2 size={24} />
                  <span className="text-[8px] font-black uppercase bg-black text-white px-2 py-0.5 italic">{b.tier} CLASS</span>
                </div>
                <p className="mt-4 font-[900] uppercase italic text-xl leading-none">{b.name}</p>
                {b.address && (
                  <p className="text-[10px] text-gray-500 mt-1 italic">{b.address}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedBld && (
        <section className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-navy text-white p-8 border-4 border-black shadow-neo flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-5xl font-[900] uppercase italic tracking-tighter text-gold leading-none">{selectedBld.name}</h3>
                <span className="bg-white text-black px-2 py-0.5 text-[10px] font-black border-2 border-black uppercase italic">{selectedBld.tier}</span>
              </div>
              {selectedBld.address && (
                <p className="font-bold text-xs uppercase mt-2 tracking-[0.1em] opacity-60 italic">
                  📍 {selectedBld.address}
                </p>
              )}
              <p className="font-black text-xs uppercase mt-1 tracking-[0.2em] opacity-60 italic">
                Inventory & Pricing / {units.length} Units Found
              </p>
            </div>
            <div className="flex gap-4">
              <NeoButton onClick={() => setShowUnitModal(true)} variant="white" className="text-xs">
                + INPUT MANUAL
              </NeoButton>
              <NeoButton onClick={() => setShowBulkModal(true)} variant="gold" className="text-xs">
                ⚡ BULK ADD (MASSAL)
              </NeoButton>
            </div>
          </div>

          <div className="relative mb-6 mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black" size={20} />
            <input 
              type="text"
              placeholder="Cari Unit atau Nama Penghuni..."
              className="w-full pl-12 pr-4 py-4 border-4 border-black font-black uppercase italic shadow-neo focus:outline-none focus:bg-yellow-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div className="flex gap-2 overflow-x-auto w-full pb-2 no-scrollbar">
              {floors.map(f => (
                <button 
                  key={f}
                  onClick={() => setActiveFloor(f)}
                  className={`px-6 py-2 border-4 border-black font-black uppercase text-xs transition-all shadow-neo whitespace-nowrap
                    ${activeFloor === f ? 'bg-navy text-white translate-x-1 translate-y-1 shadow-none' : 'bg-white'}`}
                >
                  {f === 'Semua' ? 'All Floors' : `Lantai ${f}`}
                </button>
              ))}
            </div>
            <select 
              className="border-4 border-black p-2 font-black uppercase text-xs shadow-neo focus:outline-none w-full md:w-48 bg-white"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="Semua">Semua Tipe</option>
              <option value="Elit">Elite</option>
              <option value="Standar">Standar</option>
              <option value="Ekonomis">Ekonomis</option>
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {filteredUnits.map((u) => (
              <div 
                key={u.id}
                onClick={() => setShowQuickAction(u)}
                className={`aspect-square border-4 border-black cursor-pointer transition-all shadow-neo flex flex-col items-center justify-center relative overflow-hidden group ${getStatusColor(u)}`}
              >
                <p className="text-2xl font-[1000] italic leading-none">#{u.unitNo || u.no || '?'}</p>
                <p className="text-[8px] font-black uppercase mt-1 opacity-60">Lantai {u.floor}</p>
                <div className="absolute bottom-1 flex gap-1">
                   {u.isNunggak && <Receipt size={10} className="text-white fill-black" />}
                   {u.hasComplaint && <AlertTriangle size={10} className="text-white fill-black" />}
                </div>
              </div>
            ))}
          </div>

          {filteredUnits.length === 0 && (
            <div className="py-20 border-4 border-dashed border-gray-200 text-center mt-8">
              <p className="font-black text-2xl text-gray-300 uppercase italic">Tidak ada unit yang sesuai filter.</p>
            </div>
          )}
        </section>
      )}

      {/* ===== MODAL ADD/EDIT UNIT — FIXED OVERFLOW ===== */}
      {showUnitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/90 backdrop-blur-sm p-4 text-black">
          <div className="w-full max-w-2xl bg-white border-4 border-black shadow-neo relative animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b-4 border-black p-4 bg-white sticky top-0 z-10">
              <h3 className="text-2xl font-[900] uppercase italic">
                {editUnitId ? 'Edit' : 'Add'} Unit to {selectedBld?.name}
              </h3>
              <button
                onClick={closeUnitModal}
                className="bg-red-500 text-white p-2 border-4 border-black shadow-neo hover:translate-x-1 transition-all"
              >
                <X size={24} strokeWidth={4} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSaveUnit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <NeoInput 
                    label="Unit Number" 
                    placeholder="Contoh: 12A" 
                    value={newUnit.no} 
                    onChange={(e:any) => setNewUnit({...newUnit, no: e.target.value})} 
                    required 
                  />
                  <NeoInput 
                    label="Floor" 
                    placeholder="Contoh: 3" 
                    type="number" 
                    value={newUnit.floor} 
                    onChange={(e:any) => setNewUnit({...newUnit, floor: e.target.value})} 
                    required 
                  />
                </div>

                <NeoInput 
                  label="Price Monthly (opsional jika unit khusus harian/mingguan)" 
                  placeholder="5000000" 
                  type="number" 
                  value={newUnit.price} 
                  onChange={(e:any) => setNewUnit({...newUnit, price: e.target.value})} 
                />

                <div className="grid grid-cols-2 gap-4">
                  <NeoInput 
                    label="Price Daily (opsional)" 
                    placeholder="Harga per Hari" 
                    type="number" 
                    value={newUnit.priceDaily} 
                    onChange={(e:any) => setNewUnit({...newUnit, priceDaily: e.target.value})} 
                  />
                  <NeoInput 
                    label="Price Weekly (opsional)" 
                    placeholder="Harga per Minggu" 
                    type="number" 
                    value={newUnit.priceWeekly} 
                    onChange={(e:any) => setNewUnit({...newUnit, priceWeekly: e.target.value})} 
                  />
                </div>

                <div>
                  <label className="font-black uppercase text-xs mb-3 block">Select Amenities (Fasilitas)</label>
                  <div className="flex flex-wrap gap-2">
                    {availableAmenities.map((item) => (
                      <div 
                        key={item}
                        onClick={() => toggleAmenity(item)}
                        className={`px-4 py-2 border-2 border-black font-bold text-[10px] uppercase cursor-pointer transition-all
                          ${newUnit.amenities.includes(item) ? 'bg-gold shadow-none translate-x-1 translate-y-1' : 'bg-white shadow-[2px_2px_0px_#000]'}`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-[1000] uppercase italic text-navy">
                    Unit/Room Sample Photo (Gallery)
                  </label>
                  <div className="border-4 border-black p-4 text-center relative bg-gray-50 shadow-neo hover:bg-white transition-all">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handleUnitFileChange} 
                    />
                    {unitImage ? (
                      <div className="flex flex-col items-center">
                        <img src={unitImage} className="h-24 w-40 object-cover border-4 border-black mb-2 shadow-neo" />
                        <p className="text-[8px] font-black text-green-600 uppercase">✓ Foto Kamar Terpilih</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-400 py-4">
                        <ImageIcon size={32} />
                        <p className="text-[8px] font-black uppercase mt-1 italic">Klik untuk upload foto dalam unit</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col mb-4">
                  <label className="font-black uppercase text-xs mb-2">Assign Tier (Kelas)</label>
                  <select 
                    className="w-full border-4 border-black p-3 font-bold bg-white shadow-neo focus:outline-none"
                    value={newUnit.tier}
                    onChange={(e) => setNewUnit({...newUnit, tier: e.target.value})}
                  >
                    <option value="Standar">STANDAR</option>
                    <option value="Elit">ELIT / LUXURY</option>
                    <option value="Ekonomis">EKONOMIS</option>
                  </select>
                </div>

                <div className="flex flex-col mb-4">
                  <label className="font-black uppercase text-xs mb-2">Status</label>
                  <select 
                    className="w-full border-4 border-black p-3 font-bold bg-white shadow-neo focus:outline-none"
                    value={newUnit.status}
                    onChange={(e) => setNewUnit({...newUnit, status: e.target.value})}
                  >
                    <option value="Vacant">VACANT (KOSONG)</option>
                    <option value="Occupied">OCCUPIED (TERISI)</option>
                  </select>
                </div>

                {newUnit.status === 'Occupied' && (
                  <div className="animate-in slide-in-from-top-2">
                    <NeoInput 
                      label="Tenant Name (Penghuni)" 
                      placeholder="Nama Lengkap Penghuni" 
                      value={newUnit.tenantName} 
                      onChange={(e:any) => setNewUnit({...newUnit, tenantName: e.target.value})} 
                      required 
                    />
                  </div>
                )}

                <NeoButton variant="navy" className="w-full py-4 text-xl flex items-center justify-center gap-2">
                  <Save size={20} /> {editUnitId ? 'UPDATE UNIT' : 'REGISTER UNIT ASSET'}
                </NeoButton>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL BULK ADD — DIPERBAIKI (required price dihapus) ===== */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/90 backdrop-blur-sm p-4 text-black">
          <div className="w-full max-w-2xl bg-white border-4 border-black shadow-neo relative animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b-4 border-black p-4 bg-gold sticky top-0 z-10">
              <h3 className="text-2xl font-[900] uppercase italic flex items-center gap-2">
                <Zap size={24} fill="black" /> ⚡ Bulk Unit Generator
              </h3>
              <button
                onClick={() => { setShowBulkModal(false); setUnitImage(""); }}
                className="bg-red-500 text-white p-2 border-4 border-black shadow-neo hover:translate-x-1 transition-all"
              >
                <X size={24} strokeWidth={4} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={generateBulkUnits} className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <NeoInput label="Start No" type="number" placeholder="101" value={bulkData.startNo} onChange={(e:any)=>setBulkData({...bulkData, startNo: Number(e.target.value)})} required />
                  <NeoInput label="End No" type="number" placeholder="120" value={bulkData.endNo} onChange={(e:any)=>setBulkData({...bulkData, endNo: Number(e.target.value)})} required />
                  <NeoInput label="At Floor" type="number" placeholder="1" value={bulkData.floor} onChange={(e:any)=>setBulkData({...bulkData, floor: e.target.value})} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 🔥 HAPUS required DI PRICE MONTHLY */}
                  <NeoInput 
                    label="Price / Month (opsional)" 
                    placeholder="2500000" 
                    type="number" 
                    value={bulkData.price} 
                    onChange={(e:any)=>setBulkData({...bulkData, price: e.target.value})} 
                  />
                  <div className="flex flex-col">
                    <label className="font-black uppercase text-[10px] mb-1 italic">Assign Tier</label>
                    <select className="w-full border-4 border-black p-3 font-bold bg-white shadow-neo focus:outline-none" value={bulkData.tier} onChange={(e) => setBulkData({...bulkData, tier: e.target.value})}>
                      <option value="Standar">STANDAR</option>
                      <option value="Elit">ELIT / LUXURY</option>
                      <option value="Ekonomis">EKONOMIS</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <NeoInput 
                    label="Price Daily (opsional)" 
                    placeholder="Harga per Hari" 
                    type="number" 
                    value={bulkData.priceDaily} 
                    onChange={(e:any) => setBulkData({...bulkData, priceDaily: e.target.value})} 
                  />
                  <NeoInput 
                    label="Price Weekly (opsional)" 
                    placeholder="Harga per Minggu" 
                    type="number" 
                    value={bulkData.priceWeekly} 
                    onChange={(e:any) => setBulkData({...bulkData, priceWeekly: e.target.value})} 
                  />
                </div>

                <div className="space-y-3">
                  <label className="font-black uppercase text-[10px] italic text-navy">Fasilitas untuk Batch ini:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableAmenities.map((name) => (
                      <div 
                        key={name} 
                        onClick={() => {
                          setBulkData(prev => ({
                            ...prev,
                            amenities: prev.amenities.includes(name) 
                              ? prev.amenities.filter(a => a !== name) 
                              : [...prev.amenities, name]
                          }));
                        }}
                        className={`p-2 border-[3px] border-black cursor-pointer text-center font-black text-[9px] uppercase transition-all
                          ${bulkData.amenities.includes(name) ? 'bg-gold translate-x-1 translate-y-1' : 'bg-gray-50 opacity-40 shadow-neo'}`}
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-[1000] uppercase italic text-navy">
                    Unit/Room Sample Photo (Gallery) — untuk semua unit di batch ini
                  </label>
                  <div className="border-4 border-black p-4 text-center relative bg-gray-50 shadow-neo hover:bg-white transition-all">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handleUnitFileChange} 
                    />
                    {unitImage ? (
                      <div className="flex flex-col items-center">
                        <img src={unitImage} className="h-24 w-40 object-cover border-4 border-black mb-2 shadow-neo" />
                        <p className="text-[8px] font-black text-green-600 uppercase">✓ Foto Kamar Terpilih</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-400 py-4">
                        <ImageIcon size={32} />
                        <p className="text-[8px] font-black uppercase mt-1 italic">Klik untuk upload foto dalam unit</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gold/20 p-4 border-4 border-black border-dashed">
                  <p className="text-[10px] font-black uppercase text-center">
                    Akan membuat <span className="text-navy">{Number(bulkData.endNo) - Number(bulkData.startNo) + 1}</span> unit baru
                    <br />
                    dari nomor <span className="text-navy">{bulkData.startNo}</span> sampai <span className="text-navy">{bulkData.endNo}</span>
                    <br />
                    dengan <span className="text-navy">{bulkData.amenities.length}</span> fasilitas terpilih
                  </p>
                </div>

                <NeoButton variant="navy" className="w-full py-5 text-xl flex justify-center items-center gap-3" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  {loading ? 'PROCESSING...' : `GENERATE ${Number(bulkData.endNo) - Number(bulkData.startNo) + 1} UNITS NOW`}
                </NeoButton>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL BUILDING — FIXED OVERFLOW (dengan field kontak) ===== */}
      {showBldModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/90 backdrop-blur-sm p-4 text-black text-left">
          <div className="w-full max-w-md bg-white border-4 border-black shadow-neo relative animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b-4 border-black p-4 bg-white sticky top-0 z-10">
              <h3 className="text-2xl font-[900] uppercase italic">{editBldId ? 'Edit' : 'Register'} Building</h3>
              <button onClick={closeBldModal} className="bg-red-500 text-white p-2 border-4 border-black shadow-neo hover:translate-x-1 transition-all">
                <X size={24} strokeWidth={4} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSaveBuilding} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase italic text-navy">Building Photo (Gallery)</label>
                  <div className="border-4 border-black p-4 text-center relative bg-white shadow-neo hover:bg-gray-50 transition-all">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handleFileChange}
                    />
                    {newBld.photoUrl ? (
                      <div className="flex flex-col items-center">
                        <img src={newBld.photoUrl} className="h-20 w-32 object-cover border-2 border-black mb-2" />
                        <p className="text-[8px] font-black text-green-600 uppercase">✓ Gambar Terpilih</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-400">
                        <ImageIcon size={32} />
                        <p className="text-[8px] font-black uppercase mt-1">Klik untuk pilih dari Galeri</p>
                      </div>
                    )}
                  </div>
                </div>

                <NeoInput label="Building Name" value={newBld.name} onChange={(e:any)=>setNewBld({...newBld, name: e.target.value})} required />
                
                <div className="grid grid-cols-2 gap-4">
                  <NeoInput 
                    label="Building Address" 
                    placeholder="Jl. Contoh No. 123" 
                    value={newBld.address} 
                    onChange={(e:any)=>setNewBld({...newBld, address: e.target.value})} 
                    required 
                  />
                  <div className="flex flex-col">
                    <label className="text-xs font-black uppercase mb-1">Building City</label>
                    <input
                      type="text"
                      className="border-4 border-black p-2 w-full font-bold focus:outline-none focus:bg-yellow-50"
                      placeholder="Contoh: Jakarta"
                      value={newBld.city}
                      onChange={(e) => setNewBld({...newBld, city: e.target.value})}
                    />
                  </div>
                </div>

                {/* ===== BLOK KONTAK GEDUNG (BARU) ===== */}
                <div className="p-4 border-4 border-black bg-gray-50 space-y-4">
                  <p className="text-[10px] font-[900] uppercase italic border-b-2 border-black pb-1">Kontak Gedung (Untuk Aplikasi Mobile)</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <NeoInput 
                      label="No. WhatsApp Admin" 
                      placeholder="62812xxx" 
                      value={newBld.whatsapp} 
                      onChange={(e:any)=>setNewBld({...newBld, whatsapp: e.target.value})} 
                    />
                    <NeoInput 
                      label="No. Telepon Kantor" 
                      placeholder="021555xxx" 
                      value={newBld.phone} 
                      onChange={(e:any)=>setNewBld({...newBld, phone: e.target.value})} 
                    />
                  </div>
                  
                  <NeoInput 
                    label="Email Bantuan" 
                    placeholder="admin@gedung.com" 
                    type="email"
                    value={newBld.email} 
                    onChange={(e:any)=>setNewBld({...newBld, email: e.target.value})} 
                  />

                  <NeoInput 
                    label="Jam Operasional" 
                    placeholder="Senin-Sabtu 08.00-17.00" 
                    value={newBld.operationalHours} 
                    onChange={(e:any)=>setNewBld({...newBld, operationalHours: e.target.value})} 
                  />
                </div>
                {/* ===== SELESAI BLOK KONTAK ===== */}

                <div className="flex flex-col mb-4">
                  <label className="font-black uppercase text-[10px] mb-1 italic">Building Tier</label>
                  <select className="w-full border-4 border-black p-3 font-bold bg-white shadow-neo focus:outline-none focus:bg-yellow-50" value={newBld.tier} onChange={(e) => setNewBld({...newBld, tier: e.target.value})}>
                    <option value="Standar">STANDAR</option>
                    <option value="Elit">ELIT / LUXURY</option>
                    <option value="Ekonomis">EKONOMIS</option>
                  </select>
                </div>
                <NeoButton variant="gold" className="w-full flex items-center justify-center gap-2 py-4">
                  <Save size={18}/> {editBldId ? 'UPDATE' : 'SAVE'} ASSET
                </NeoButton>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ===== QUICK ACTION MODAL — with Delete button ===== */}
      {showQuickAction && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border-4 border-black shadow-neo relative animate-in zoom-in-95 p-0 overflow-hidden max-h-[90vh] flex flex-col">
            <div className={`p-6 border-b-4 border-black ${getStatusColor(showQuickAction)} flex justify-between items-center`}>
              <div>
                <h3 className="text-3xl font-[900] uppercase italic tracking-tighter">Unit {showQuickAction.unitNo}</h3>
                <span className="bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase italic">{showQuickAction.tier} Class</span>
              </div>
              <button onClick={() => setShowQuickAction(null)} className="bg-red-500 text-white p-2 border-4 border-black shadow-neo hover:translate-x-1 transition-all">
                <X size={20} strokeWidth={4} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 text-black">
              {showQuickAction.status === 'Occupied' ? (
                <div className="space-y-4">
                   <div className="flex items-center gap-4 bg-gray-100 p-4 border-4 border-black shadow-neo">
                      <div className="bg-navy p-2 border-2 border-black text-white"><User size={24}/></div>
                      <div className="flex-1">
                         <p className="text-[10px] font-black text-gray-400 uppercase">Tenant & WhatsApp</p>
                         <p className="font-[1000] text-xl leading-none uppercase">{showQuickAction.tenantName || "Unknown Tenant"}</p>
                         <p className="text-sm font-bold text-navy mt-1">{showQuickAction.tenantPhone || "No Phone Recorded"}</p>
                      </div>
                      <button 
                        onClick={() => window.open(`https://wa.me/${showQuickAction.tenantPhone?.replace(/\D/g, '') || '62812'}`, '_blank')}
                        className="bg-green-400 border-4 border-black p-2 shadow-[3px_3px_0px_#000] hover:translate-x-1 transition-all active:shadow-none"
                      >
                        <Phone size={20} strokeWidth={3}/>
                      </button>
                   </div>

                   <div className="bg-yellow-50 p-5 border-4 border-black border-dashed relative">
                      <p className="text-[10px] font-[1000] uppercase text-gray-400 mb-2 italic">Masa Kontrak Aktif</p>
                      <div className="flex justify-between items-center">
                         <div>
                            <p className="text-sm font-[1000] uppercase tracking-tighter">
                               {showQuickAction.leaseStart || "N/A"} — {showQuickAction.leaseEnd || "N/A"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                               <div className="h-2 w-2 rounded-full bg-red-500 animate-ping"></div>
                               <p className="text-xs font-[1000] text-red-600 uppercase italic">
                                  Sisa: {calculateDaysLeft(showQuickAction.leaseEnd)} Hari Lagi
                               </p>
                            </div>
                         </div>
                         <Clock size={32} className="opacity-10 absolute right-4" />
                      </div>
                   </div>
                </div>
              ) : (
                <div className="py-6 text-center border-4 border-dashed border-gray-200">
                   <Home size={48} className="mx-auto text-gray-200 mb-4" />
                   <p className="font-[1000] text-gray-300 uppercase italic text-2xl tracking-tighter">Unit Is Available</p>
                   <p className="text-[10px] font-black text-gray-400 uppercase mt-2">Kamar siap dihuni oleh tenant baru</p>
                </div>
              )}
            </div>

            <div className="px-8 pb-8 border-t-4 border-black pt-4 flex flex-col gap-3">
              <NeoButton 
                variant="gold" 
                className="w-full text-xs flex items-center justify-between"
                onClick={() => navigate('/owner/billing', { state: { targetUnit: showQuickAction.unitNo } })}
              >
                Kirim Tagihan Cepat <Receipt size={16}/>
              </NeoButton>

              {/* 🆕 Tombol Hapus Unit — hanya untuk unit kosong (Vacant) */}
              {showQuickAction.status !== 'Occupied' && (
                <NeoButton 
                  variant="white" 
                  className="w-full text-xs border-2 border-red-500 text-red-600 flex items-center justify-center gap-2 hover:bg-red-50"
                  onClick={() => {
                    if (window.confirm(`Yakin ingin menghapus Unit ${showQuickAction.unitNo}?`)) {
                      handleDeleteUnit(showQuickAction.id);
                      setShowQuickAction(null);
                    }
                  }}
                >
                  <Trash2 size={16} className="text-red-500" /> Hapus Unit
                </NeoButton>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LEGEND */}
      <div className="fixed bottom-6 right-6 bg-white border-4 border-black p-4 shadow-neo flex flex-col gap-2 z-40 hidden md:flex">
        <p className="text-[9px] font-black uppercase border-b-2 border-black pb-1 mb-1">Status Kamar</p>
        <LegendItem color="bg-green-400" label="Terisi & Lunas" />
        <LegendItem color="bg-red-400" label="Nunggak / Komplain" />
        <LegendItem color="bg-blue-400" label="Tersedia" />
        <LegendItem color="bg-yellow-400" label="Perbaikan / Housekeeping" />
      </div>

    </div>
  );
};