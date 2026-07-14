import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeoCard, NeoButton, NeoInput } from '../components/ui/NeoUI';
import { UserPlus, Eye, EyeOff, Building2 } from 'lucide-react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { api } from '../api';
import toast from 'react-hot-toast';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [apartmentName, setApartmentName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!name.trim()) { 
      setErrorMsg('Nama lengkap wajib diisi.');
      toast.error('Nama lengkap wajib diisi.', {
        style: {
          border: '4px solid black',
          padding: '16px',
          fontWeight: '900',
          borderRadius: '0px',
          boxShadow: '4px 4px 0px 0px #000',
        },
      });
      setLoading(false);
      return; 
    }
    if (!apartmentName.trim()) { 
      setErrorMsg('Nama apartemen wajib diisi.');
      toast.error('Nama apartemen wajib diisi.', {
        style: {
          border: '4px solid black',
          padding: '16px',
          fontWeight: '900',
          borderRadius: '0px',
          boxShadow: '4px 4px 0px 0px #000',
        },
      });
      setLoading(false);
      return; 
    }
    if (!email.trim()) { 
      setErrorMsg('Email wajib diisi.');
      toast.error('Email wajib diisi.', {
        style: {
          border: '4px solid black',
          padding: '16px',
          fontWeight: '900',
          borderRadius: '0px',
          boxShadow: '4px 4px 0px 0px #000',
        },
      });
      setLoading(false);
      return; 
    }
    if (password.length < 6) { 
      setErrorMsg('Password minimal 6 karakter.');
      toast.error('Password minimal 6 karakter.', {
        style: {
          border: '4px solid black',
          padding: '16px',
          fontWeight: '900',
          borderRadius: '0px',
          boxShadow: '4px 4px 0px 0px #000',
        },
      });
      setLoading(false);
      return; 
    }
    if (password !== confirmPassword) { 
      setErrorMsg('Password tidak cocok.');
      toast.error('Password tidak cocok.', {
        style: {
          border: '4px solid black',
          padding: '16px',
          fontWeight: '900',
          borderRadius: '0px',
          boxShadow: '4px 4px 0px 0px #000',
        },
      });
      setLoading(false);
      return; 
    }

    try {
      // 1. Buat User di Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Simpan Data Owner ke Firestore
      await setDoc(doc(db, "owners", userCredential.user.email!), {
        uid: userCredential.user.uid,
        fullName: name,
        email: email,
        buildingName: apartmentName,
        role: 'owner',
        isVerified: false,
        createdAt: new Date()
      });

      // 3. Kirim OTP lewat Backend FastAPI
      localStorage.removeItem('otp_verified'); // Pastikan kunci bersih
      await api.post('/auth/send-otp', { email: email });
      
      toast.success('Pendaftaran Sukses! Mengalihkan ke verifikasi...', {
        style: {
          border: '4px solid black',
          padding: '16px',
          fontWeight: '900',
          borderRadius: '0px',
          boxShadow: '4px 4px 0px 0px #000',
        },
      });

      // Hapus dulu kunci lama kalau ada (biar bersih)
      localStorage.removeItem('otp_verified');

      // Gunakan window.location agar browser "sadar" dan pindah total
      // Kita kirim email lewat URL query biar OtpPage gampang bacanya
      window.location.href = `/verify-otp?email=${email}`;

    } catch (error: any) {
      console.error(error);
      let errorMessage = '';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email sudah digunakan.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format email tidak valid.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password terlalu lemah.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else {
        errorMessage = 'Gagal daftar. Coba lagi.';
      }
      setErrorMsg(errorMessage);
      toast.error(errorMessage, {
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
    <div className="min-h-screen bg-[#0F1F3D] flex items-center justify-center p-6 font-sans text-black">
      <NeoCard className="w-full max-w-lg p-0 overflow-hidden border-[6px]">
        <div className="bg-[#F5A623] p-8 border-b-[6px] border-black text-center">
          <div className="mb-4 inline-block p-4 border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <UserPlus size={40} className="text-black" />
          </div>
          <h2 className="text-4xl font-[900] uppercase italic tracking-tight leading-none">Daftar Sebagai Owner</h2>
          <p className="font-black text-[10px] uppercase tracking-[0.3em] mt-2 text-black/60">Owner Registration Portal</p>
        </div>

        <div className="p-10">
          {errorMsg && (
            <div className="bg-red-400 border-4 border-black p-3 mb-6 font-black uppercase text-xs italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              ⚠ {errorMsg}
            </div>
          )}

          <form onSubmit={handleManualRegister}>
            <NeoInput
              label="Nama Lengkap"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e: any) => setName(e.target.value)}
              required
            />

            <div className="flex flex-col mb-4">
              <label className="font-[900] uppercase text-[10px] mb-1 tracking-widest text-[#0F1F3D] italic">Nama Apartemen</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Apartemen Grand XYZ"
                  value={apartmentName}
                  onChange={(e) => setApartmentName(e.target.value)}
                  required
                  className="w-full border-[4px] border-black p-3 pl-10 font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
                <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <NeoInput
              label="Email"
              type="email"
              placeholder="owner@email.com"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              required
            />

            <div className="flex flex-col mb-4">
              <label className="font-[900] uppercase text-[10px] mb-1 tracking-widest text-[#0F1F3D] italic">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border-[4px] border-black p-3 pr-12 font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col mb-6">
              <label className="font-[900] uppercase text-[10px] mb-1 tracking-widest text-[#0F1F3D] italic">Konfirmasi Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full border-[4px] border-black p-3 pr-12 font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <NeoButton className="w-full py-4 text-xl flex justify-center items-center gap-3" variant="gold" disabled={loading}>
              {loading ? 'Mendaftarkan...' : <><UserPlus size={22} /> Buat Akun Owner</>}
            </NeoButton>
          </form>

          <div className="mt-8 text-center pt-6 border-t-4 border-black/10">
            <p className="font-bold text-xs uppercase text-gray-500">Sudah punya akun?</p>
            <button onClick={() => navigate('/login')} className="mt-2 text-[#0F1F3D] font-[900] uppercase italic underline decoration-[#F5A623] decoration-4">
              Kembali ke Login
            </button>
          </div>
        </div>
      </NeoCard>
    </div>
  );
};