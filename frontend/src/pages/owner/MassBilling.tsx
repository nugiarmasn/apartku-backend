import { useEffect, useState } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { NeoCard, NeoButton, NeoInput } from '../../components/ui/NeoUI';
import { Receipt, Zap, Send, CreditCard, Users, Check, Loader2, Calendar, AlertCircle, Trash2, Download, ExternalLink, Printer } from 'lucide-react';
import { api } from '../../api';
import toast from 'react-hot-toast';

export const MassBilling = () => {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedBld, setSelectedBld] = useState('');
  const [tenants, setTenants] = useState<any[]>([]); 
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [invoices, setInvoices] = useState<any[]>([]);

  const [billingData, setFormData] = useState({ 
    title: '', 
    amountElit: '', 
    amountStandar: '', 
    amountEko: '', 
    dueDate: '' 
  });

  const handleDeleteInvoice = async (id: string) => {
    if (window.confirm("Hapus tagihan ini? Data tidak bisa dikembalikan.")) {
      try {
        await deleteDoc(doc(db, "bills", id));
        toast.success('Tagihan berhasil dihapus!', {
          style: {
            border: '4px solid black',
            padding: '16px',
            fontWeight: '900',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
          },
        });
      } catch (err) {
        toast.error('Gagal hapus data', {
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

  const handlePrintInvoice = (inv: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Bukti Tagihan - ${inv.unit_no}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; border: 10px solid black; }
              h1 { text-transform: uppercase; font-size: 40px; margin-bottom: 0; }
              .status { background: ${inv.status === 'PAID' ? '#4ADE80' : '#F5A623'}; padding: 5px 10px; display: inline-block; font-weight: bold; border: 2px solid black; }
              .detail { margin-top: 30px; font-size: 18px; line-height: 1.6; }
              .footer { margin-top: 50px; border-top: 2px dashed black; padding-top: 20px; font-size: 12px; }
            </style>
          </head>
          <body>
            <p>APARTKU SYSTEM</p>
            <h1>INVOICE #${inv.bill_id}</h1>
            <div class="status">STATUS: ${inv.status}</div>
            <div class="detail">
              <p><strong>Penyewa:</strong> ${inv.tenant_name}</p>
              <p><strong>Unit:</strong> ${inv.unit_no}</p>
              <p><strong>Keterangan:</strong> ${inv.title}</p>
              <p><strong>Total Bayar:</strong> Rp ${inv.amount?.toLocaleString()}</p>
              <p><strong>Metode:</strong> ${inv.payment_type?.replace('_', ' ') || inv.payment_method || '-'}</p>
              <p><strong>Jatuh Tempo:</strong> ${inv.due_date}</p>
            </div>
            <div class="footer">Dicetak pada: ${new Date().toLocaleString()}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  useEffect(() => {
    const email = auth.currentUser?.email;
    if (!email) return;

    const q = query(collection(db, "buildings"), where("ownerEmail", "==", email));
    const unsub = onSnapshot(q, (snap) => {
      setBuildings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedBld) {
      setTenants([]);
      setSelectedTenants([]);
      return;
    }
    const q = query(collection(db, "units"), where("buildingId", "==", selectedBld), where("status", "==", "Occupied"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTenants(data);
      setSelectedTenants(data.map(t => t.id));
    });
    return () => unsub();
  }, [selectedBld]);

  useEffect(() => {
    const email = auth.currentUser?.email;
    if (!email) return;

    const q = query(
      collection(db, "bills"), 
      where("owner_email", "==", email),
      orderBy("created_at", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Gagal tarik tabel:", err);
    });

    return () => unsub();
  }, []);

  const toggleTenant = (id: string) => {
    setSelectedTenants(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleGenerate = async (e: any) => {
    e.preventDefault();
    if (selectedTenants.length === 0) {
      toast.error('Pilih minimal satu penghuni di daftar kanan!', {
        style: {
          border: '4px solid black',
          padding: '16px',
          fontWeight: '900',
          borderRadius: '0px',
          boxShadow: '4px 4px 0px 0px #000',
        },
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/owner/generate-mass-billing', {
        buildingId: selectedBld,
        ownerEmail: auth.currentUser?.email,
        title: billingData.title,
        amountElit: Number(billingData.amountElit) || 0,
        amountStandar: Number(billingData.amountStandar) || 0,
        amountEko: Number(billingData.amountEko) || 0,
        dueDate: billingData.dueDate,
        targetTenantIds: selectedTenants
      });

      if (response.data.status === 'success') {
        toast.success(`SUKSES! ${response.data.total_sent} Tagihan & Link Midtrans telah dikirim.`, {
          style: {
            border: '4px solid black',
            padding: '16px',
            fontWeight: '900',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
          },
        });
        setFormData({ title: '', amountElit: '', amountStandar: '', amountEko: '', dueDate: '' });
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal memproses penagihan. Pastikan Backend FastAPI jalan.', {
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
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="border-b-8 border-black pb-4">
        <h3 className="text-5xl font-[900] uppercase italic tracking-tighter text-navy">Billing Engine.</h3>
        <p className="font-black text-gray-400 uppercase text-[10px] mt-1 italic tracking-widest">Generate Invoices & Midtrans Payment Links</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        <div className="col-span-12 lg:col-span-7">
          <NeoCard className="bg-white border-[6px]">
            <div className="bg-gold -mx-8 -mt-8 p-6 mb-8 border-b-4 border-black flex items-center gap-4">
               <Zap className="text-black" size={32} strokeWidth={3} />
               <h4 className="text-black font-[900] uppercase italic text-2xl tracking-tight">Invoice Configuration</h4>
            </div>

            <form onSubmit={handleGenerate} className="space-y-6 text-black">
              <div>
                <label className="text-[10px] font-black uppercase italic text-navy">1. Select Target Building</label>
                <select 
                  className="w-full border-4 border-black p-4 font-bold shadow-neo focus:outline-none bg-white mt-1"
                  value={selectedBld}
                  onChange={(e) => setSelectedBld(e.target.value)}
                  required
                >
                  <option value="">-- PILIH GEDUNG --</option>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.name} ({b.tier} Class)</option>)}
                </select>
              </div>

              <NeoInput 
                label="2. Billing Title" 
                placeholder="Misal: Iuran Sewa & Keamanan Agustus 2024" 
                value={billingData.title}
                onChange={(e:any) => setFormData({...billingData, title: e.target.value})}
                required 
              />

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase italic text-navy">3. Set Price per Tier (Rp)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <NeoInput placeholder="Elit" type="number" value={billingData.amountElit} onChange={(e:any) => setFormData({...billingData, amountElit: e.target.value})} />
                  <NeoInput placeholder="Standar" type="number" value={billingData.amountStandar} onChange={(e:any) => setFormData({...billingData, amountStandar: e.target.value})} />
                  <NeoInput placeholder="Eko" type="number" value={billingData.amountEko} onChange={(e:any) => setFormData({...billingData, amountEko: e.target.value})} />
                </div>
                <p className="text-[8px] font-bold text-gray-400 italic uppercase">*Kosongkan jika tidak ada unit di kelas tersebut</p>
              </div>

              <NeoInput 
                label="4. Payment Due Date" 
                type="date" 
                value={billingData.dueDate}
                onChange={(e:any) => setFormData({...billingData, dueDate: e.target.value})}
                required 
              />

              <div className="pt-4">
                <NeoButton 
                  className="w-full py-6 text-2xl flex justify-center items-center gap-4" 
                  variant="navy"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin" /> : <><Send size={28} /> EXECUTE ({selectedTenants.length})</>}
                </NeoButton>
              </div>

              <div className="flex justify-center items-center gap-2 text-[10px] font-black text-gray-400 italic">
                <CreditCard size={14} /> SECURE TRANSACTION VIA MIDTRANS SNAP
              </div>
            </form>
          </NeoCard>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <NeoCard className="h-full border-[6px] bg-gray-50 flex flex-col p-0 overflow-hidden">
             <div className="p-6 border-b-4 border-black bg-white flex justify-between items-center">
                <h4 className="font-[900] uppercase italic text-lg">Target Units</h4>
                <div className="bg-black text-white px-2 py-1 text-[10px] font-black uppercase italic shadow-neo">
                   {selectedTenants.length} Selected
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[650px]">
                {tenants.map((t) => (
                  <div 
                    key={t.id} 
                    onClick={() => toggleTenant(t.id)}
                    className={`flex items-center gap-4 p-4 border-4 border-black cursor-pointer transition-all shadow-neo active:shadow-none
                      ${selectedTenants.includes(t.id) ? 'bg-gold translate-x-1 translate-y-1 shadow-none' : 'bg-white hover:bg-yellow-50'}`}
                  >
                    <div className={`w-6 h-6 border-4 border-black flex items-center justify-center ${selectedTenants.includes(t.id) ? 'bg-black' : 'bg-white'}`}>
                       {selectedTenants.includes(t.id) && <Check size={16} className="text-white" strokeWidth={5} />}
                    </div>
                    <div className="flex-1">
                       <p className="font-[900] uppercase italic text-sm leading-none">Unit {t.unitNo} — {t.tenantName}</p>
                       <div className="flex justify-between items-center mt-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase italic">Lantai: {t.floor} | Tier: {t.tier}</p>
                          <span className="text-[8px] font-[900] text-green-600 uppercase">Lancar ✓</span>
                       </div>
                    </div>
                  </div>
                ))}

                {tenants.length === 0 && (
                  <div className="text-center py-20 opacity-30 italic font-black uppercase flex flex-col items-center gap-4">
                     <AlertCircle size={48} />
                     <p>Gedung belum punya penghuni aktif</p>
                  </div>
                )}
             </div>
          </NeoCard>
        </div>
      </div>

      <NeoCard className="mt-10 p-0 overflow-hidden border-[6px]">
        <div className="p-6 bg-navy text-white border-b-4 border-black">
          <h3 className="text-2xl font-[900] uppercase italic tracking-tighter">Live Invoice Monitor</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left bg-white font-bold uppercase text-[10px]">
            <thead className="bg-gray-100 border-b-4 border-black font-black uppercase text-[10px]">
              <tr>
                <th className="p-4 text-center">Date</th>
                <th className="p-4">Unit</th>
                <th className="p-4">Tenant</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Method</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b-4 border-black hover:bg-yellow-50 transition-colors">
                  <td className="p-4 text-center text-gray-500 font-bold">
                    {inv.created_at ? new Date(inv.created_at).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) : 'N/A'}
                  </td>
                  <td className="p-4 italic">#{inv.unit_no}</td>
                  <td className="p-4">{inv.tenant_name}</td>
                  <td className="p-4 font-black">Rp {inv.amount?.toLocaleString()}</td>
                  
                  {/* INFO PEMBAYARAN LEWAT APA */}
                  <td className="p-4">
                    {inv.status === 'PAID' ? (
                      <div className="flex items-center gap-2">
                        <div className="bg-navy text-white px-2 py-0.5 border-2 border-black text-[8px] font-black uppercase shadow-[2px_2px_0px_#000]">
                          {inv.payment_type?.replace('_', ' ') || inv.payment_method || 'BANK'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-300 font-black">-</span>
                    )}
                  </td>

                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 border-2 border-black font-black shadow-[2px_2px_0px_#000] 
                      ${inv.status === 'PAID' ? 'bg-green-400' : 'bg-gold'}`}>
                      {inv.status}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => window.open(inv.payment_url, '_blank')}
                        className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_#000] hover:bg-navy hover:text-white transition-all"
                        title="Bayar"
                      >
                        <ExternalLink size={14} />
                      </button>

                      <button 
                        onClick={() => handlePrintInvoice(inv)}
                        className="bg-blue-400 border-2 border-black p-2 shadow-[2px_2px_0px_#000] hover:translate-x-0.5 transition-all"
                        title="Cetak Bukti"
                      >
                        <Printer size={14} />
                      </button>

                      <button 
                        onClick={() => handleDeleteInvoice(inv.id)}
                        className="bg-red-500 text-white border-2 border-black p-2 shadow-[2px_2px_0px_#000] hover:bg-red-700 transition-all"
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </NeoCard>
    </div>
  );
};