import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeoCard, NeoButton, NeoInput } from '../components/ui/NeoUI';
import { Globe, ShieldCheck, LogIn, Eye, EyeOff } from 'lucide-react';
import { auth, db, googleProvider } from '../firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword
} from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { api } from '../api';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- JALUR MANUAL ---
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Cek apakah email terdaftar di Admins atau Owners
      const adminSnap = await getDoc(doc(db, 'admins', user.email!));
      const qOwner = query(collection(db, 'owners'), where('email', '==', user.email));
      const ownerSnap = await getDocs(qOwner);

      if (adminSnap.exists() || !ownerSnap.empty) {
        localStorage.removeItem('otp_verified'); // Gembok dashboard
        await api.post('/auth/send-otp', { email: user.email }); // Minta OTP
        navigate('/verify-otp', { state: { email: user.email } });
      } else {
        toast.error('Akun tidak terdaftar sebagai Admin/Owner', {
          style: {
            border: '4px solid black',
            padding: '16px',
            fontWeight: '900',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
          },
        });
        await auth.signOut();
      }
    } catch (error: any) {
      console.error('Manual Login Error:', error.code);
      let msg = 'Password salah!';
      if (error.code === 'auth/too-many-requests') msg = 'Terlalu banyak mencoba, coba lagi nanti.';
      setErrorMsg(msg);
      toast.error(msg, {
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

  // --- JALUR GOOGLE ---
  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const adminSnap = await getDoc(doc(db, 'admins', user.email!));
      const qOwner = query(collection(db, 'owners'), where('email', '==', user.email));
      const ownerSnap = await getDocs(qOwner);

      if (adminSnap.exists() || !ownerSnap.empty) {
        // ✅ LANGSUNG SET VERIFIED (Tanpa OTP)
        localStorage.setItem('otp_verified', 'true');
        const target = adminSnap.exists() ? '/super-admin/dashboard' : '/owner/dashboard';
        window.location.href = target; // Full reload biar App.tsx sadar
      } else {
        toast.error('Akun Google belum terdaftar.', {
          style: {
            border: '4px solid black',
            padding: '16px',
            fontWeight: '900',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
          },
        });
        await auth.signOut();
      }
    } catch (error: any) {
      console.error('Google Login Error:', error.code);
      let msg = 'Gagal Login Google';
      if (error.code === 'auth/popup-closed-by-user') msg = 'Login Google dibatalkan.';
      setErrorMsg(msg);
      toast.error(msg, {
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
      <NeoCard className="w-full max-w-md p-0 overflow-hidden border-[6px]">
        <div className="bg-[#0F1F3D] p-8 border-b-[6px] border-black text-center text-white">
          <div className="mb-4 inline-block p-4 border-4 border-black bg-[#F5A623] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <ShieldCheck size={40} className="text-black" />
          </div>
          <h2 className="text-4xl font-[900] uppercase italic tracking-tight leading-none">
            Login System
          </h2>
          <p className="font-black text-[10px] uppercase tracking-[0.3em] mt-2 text-gray-400">
            Secure Access Portal
          </p>
        </div>

        <div className="p-10">
          {errorMsg && (
            <div className="bg-red-400 border-4 border-black p-3 mb-6 font-black uppercase text-xs italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              ⚠ {errorMsg}
            </div>
          )}

          <form onSubmit={handleManualLogin}>
            <NeoInput
              label="Admin / Owner Email"
              type="email"
              placeholder="email@apartku.com"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <NeoInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[52px] text-gray-600 hover:text-black transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <NeoButton
              className="w-full py-4 text-xl flex justify-center items-center gap-3 mt-2"
              variant="navy"
              disabled={loading}
            >
              {loading ? 'Memproses...' : <>Sign In <LogIn size={20} /></>}
            </NeoButton>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="h-[4px] bg-black flex-1 opacity-20"></div>
            <span className="font-[900] text-[10px] uppercase text-gray-400 italic">Atau</span>
            <div className="h-[4px] bg-black flex-1 opacity-20"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full border-[4px] border-black p-4 font-[900] uppercase italic flex items-center justify-center gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white hover:bg-[#F5A623] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
          >
            <Globe size={24} className="text-red-500" />
            Sign in with Google
          </button>

          <div className="mt-8 text-center pt-6 border-t-4 border-black/10">
            <p className="font-bold text-xs uppercase text-gray-500">Belum punya akun Owner?</p>
            <button
              onClick={() => navigate('/register')}
              className="mt-2 text-[#0F1F3D] font-[900] uppercase italic underline decoration-[#F5A623] decoration-4 hover:text-[#F5A623] transition-all"
            >
              Daftar Jadi Owner →
            </button>
          </div>
        </div>
      </NeoCard>
    </div>
  );
};