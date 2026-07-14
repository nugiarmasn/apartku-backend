import { useEffect, useState } from 'react';
import { db, auth } from '../../firebase';
import { doc, onSnapshot, updateDoc, query, collection, where } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { NeoCard, NeoButton, NeoInput } from '../../components/ui/NeoUI';
import { User, Mail, Phone, Building2, Camera, Save, Loader2, ShieldCheck, Lock, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProfilePage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPass, setUpdatingPass] = useState(false);

  useEffect(() => {
    const userEmail = auth.currentUser?.email;
    if (!userEmail) return;

    const q = query(collection(db, "owners"), where("email", "==", userEmail));
    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setProfile({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePhotoChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, photoUrl: reader.result as string });
        toast.success('Foto profil berhasil diupload!', {
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

  const handleUpdate = async (e: any) => {
    e.preventDefault();
    if (!profile.id) {
      toast.error('Data profil tidak ditemukan!', {
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
    
    setSaving(true);
    try {
      const ownerRef = doc(db, "owners", profile.id);
      await updateDoc(ownerRef, {
        fullName: profile.fullName,
        phone: profile.phone,
        photoUrl: profile.photoUrl || ""
      });

      toast.success('PROFIL BERHASIL DIUPDATE!', {
        style: {
          border: '4px solid black',
          padding: '16px',
          fontWeight: '900',
          borderRadius: '0px',
          boxShadow: '4px 4px 0px 0px #000',
        },
      });
    } catch (err) {
      console.error(err);
      toast.error('GAGAL MENYIMPAN DATA!', {
        style: {
          border: '4px solid black',
          padding: '16px',
          fontWeight: '900',
          borderRadius: '0px',
          boxShadow: '4px 4px 0px 0px #000',
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: any) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      return toast.error("Password Baru & Konfirmasi tidak cocok!", {
        style: {
          border: '4px solid black',
          padding: '16px',
          fontWeight: '900',
          borderRadius: '0px',
          boxShadow: '4px 4px 0px 0px #000',
        },
      });
    }
    if (newPassword.length < 6) {
      return toast.error("Password minimal 6 karakter!", {
        style: {
          border: '4px solid black',
          padding: '16px',
          fontWeight: '900',
          borderRadius: '0px',
          boxShadow: '4px 4px 0px 0px #000',
        },
      });
    }

    setUpdatingPass(true);
    const user = auth.currentUser;

    try {
      if (user && user.email) {
        const credential = EmailAuthProvider.credential(user.email, oldPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);

        toast.success('PASSWORD BERHASIL DIGANTI!', {
          style: {
            border: '4px solid black',
            padding: '16px',
            fontWeight: '900',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
          },
        });

        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password') {
        toast.error("Password Lama Salah!", {
          style: {
            border: '4px solid black',
            padding: '16px',
            fontWeight: '900',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
          },
        });
      } else {
        toast.error("Gagal ganti password. Coba login ulang dulu.", {
          style: {
            border: '4px solid black',
            padding: '16px',
            fontWeight: '900',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
          },
        });
      }
    } finally {
      setUpdatingPass(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-black italic uppercase text-gray-400">Syncing Profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-8 duration-700">
      
      <div className="border-b-8 border-black pb-4">
        <h2 className="text-6xl font-[900] uppercase italic tracking-tighter text-navy leading-none">Settings.</h2>
        <p className="font-black text-gray-400 uppercase text-xs mt-2 italic tracking-[0.3em]">Owner Identity Management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* KIRI: FOTO PROFIL */}
        <div className="md:col-span-4 space-y-6">
          <NeoCard className="flex flex-col items-center text-center p-10 bg-white">
            <div className="relative group">
               <div className="w-40 h-40 border-4 border-black shadow-neo overflow-hidden rotate-3 bg-gray-100">
                  <img 
                    src={profile?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email}`} 
                    className="w-full h-full object-cover" 
                    alt="Avatar" 
                  />
               </div>
               <label className="absolute -bottom-2 -right-2 bg-gold border-4 border-black p-2 shadow-neo cursor-pointer hover:scale-110 transition-transform">
                  <Camera size={20} />
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
               </label>
            </div>
            
            <div className="mt-8 space-y-1">
              <h4 className="font-[900] uppercase italic text-xl leading-none">{profile?.fullName}</h4>
              <p className="text-[10px] font-black text-gray-400 uppercase">{profile?.email}</p>
            </div>

            <div className="mt-6 bg-green-100 border-2 border-black px-3 py-1 flex items-center gap-2">
               <ShieldCheck size={14} className="text-green-700" />
               <span className="text-[8px] font-black text-green-700 uppercase">Verified Owner</span>
            </div>
          </NeoCard>
        </div>

        {/* KANAN: FORM DATA + GANTI PASSWORD (SATU CARD) */}
        <div className="md:col-span-8">
          <NeoCard className="bg-white border-[6px] p-8">
            {/* HEADER */}
            <div className="flex items-center gap-3 mb-8 border-b-4 border-black pb-4 text-navy">
              <User size={28} strokeWidth={3} />
              <h3 className="text-2xl font-[900] uppercase italic tracking-tighter">Profile & Security</h3>
            </div>

            {/* FORM DATA DIRI */}
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NeoInput 
                  label="Nama Lengkap" 
                  value={profile?.fullName || ''} 
                  onChange={(e:any) => setProfile({...profile, fullName: e.target.value})}
                  required 
                />
                <NeoInput 
                  label="Nomor WhatsApp" 
                  placeholder="0812xxxx" 
                  value={profile?.phone || ''}
                  onChange={(e:any) => setProfile({...profile, phone: e.target.value})}
                  required 
                />
              </div>

              <div className="flex flex-col">
                 <label className="font-[900] uppercase text-[10px] mb-1 italic text-navy">Building Info (Locked)</label>
                 <div className="p-4 border-4 border-black bg-gray-50 font-bold opacity-50 italic">
                    {profile?.buildingName || '-'}
                 </div>
                 <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase">*Ubah info gedung di menu Unit Management</p>
              </div>

              <NeoButton 
                variant="navy" 
                className="w-full py-4 text-xl flex justify-center items-center gap-3"
                disabled={saving}
              >
                {saving ? <Loader2 className="animate-spin" /> : <><Save size={24} /> SIMPAN PERUBAHAN</>}
              </NeoButton>
            </form>

            {/* DIVIDER */}
            <div className="my-10 border-t-4 border-black border-dashed"></div>

            {/* FORM GANTI PASSWORD */}
            <div className="flex items-center gap-3 mb-6 text-navy">
              <Lock size={28} strokeWidth={3} />
              <h3 className="text-2xl font-[900] uppercase italic tracking-tighter">Ganti Password</h3>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <NeoInput 
                label="Password Saat Ini" 
                type="password" 
                placeholder="••••••••" 
                value={oldPassword}
                onChange={(e:any) => setOldPassword(e.target.value)}
                required 
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NeoInput 
                  label="Password Baru" 
                  type="password" 
                  placeholder="••••••••" 
                  value={newPassword}
                  onChange={(e:any) => setNewPassword(e.target.value)}
                  required 
                />
                <NeoInput 
                  label="Konfirmasi Password Baru" 
                  type="password" 
                  placeholder="••••••••" 
                  value={confirmPassword}
                  onChange={(e:any) => setConfirmPassword(e.target.value)}
                  required 
                />
              </div>

              <div className="bg-red-50 p-4 border-4 border-black border-dashed flex items-center gap-4">
                <ShieldAlert className="text-red-600 shrink-0" size={24} />
                <p className="text-[10px] font-black uppercase text-gray-500 italic leading-tight">
                  Gunakan password yang kuat (kombinasi huruf & angka). <br/>
                  Setelah ganti password, sesi login lo akan tetap aktif.
                </p>
              </div>

              <NeoButton 
                variant="gold" 
                className="w-full py-4 text-xl flex justify-center items-center gap-3"
                disabled={updatingPass}
              >
                {updatingPass ? <Loader2 className="animate-spin" /> : "UPDATE PASSWORD"}
              </NeoButton>
            </form>
          </NeoCard>
        </div>

      </div>
    </div>
  );
};