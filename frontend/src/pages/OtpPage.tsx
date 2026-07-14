import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NeoCard, NeoButton } from '../components/ui/NeoUI';
import { Mail, ArrowRight, ShieldAlert, RotateCcw } from 'lucide-react';
import { api } from '../api';
import toast from 'react-hot-toast';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const OtpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Ambil email dari URL (?email=xxx) atau dari location.state
  const queryParams = new URLSearchParams(window.location.search);
  const emailFromUrl = queryParams.get('email');
  const email = location.state?.email || emailFromUrl || auth.currentUser?.email;
  const isRegister: boolean = location.state?.isRegister || false;
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email && !pageLoading) {
      toast.error("Sesi kadaluarsa, silakan login ulang");
      navigate('/login');
    }
    setPageLoading(false);
  }, [email, pageLoading, navigate]);

  if (!email && pageLoading) {
    return (
      <div className="min-h-screen bg-[#0F1F3D] flex items-center justify-center">
        <div className="bg-white border-4 border-black p-8 shadow-neo animate-pulse">
          <p className="font-[900] uppercase italic text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  if (!email) {
    navigate('/login');
    return null;
  }

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setErrorMsg('');
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => { if (i < 6) newOtp[i] = char; });
    setOtp(newOtp);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setErrorMsg('Masukkan 6 digit kode OTP.');
      toast.error('Masukkan 6 digit kode OTP.', {
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
      const res = await api.post('/auth/verify-otp', { email, otp: otpCode });
      
      if (res.data.status === 'success') {
        console.log("OTP VALID! Menyiapkan akses...");
        
        if (isRegister) {
          const ownerRef = doc(db, "owners", email);
          await updateDoc(ownerRef, { isVerified: true });
        }
        
        localStorage.setItem('otp_verified', 'true');
        
        toast.success('Verifikasi berhasil!', {
          style: {
            border: '4px solid black',
            padding: '16px',
            fontWeight: '900',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
          },
        });
        
        const target = res.data.role === 'super_admin' ? '/super-admin/dashboard' : '/owner/dashboard';
        window.location.href = target;
      } else {
        toast.error("KODE OTP SALAH!", {
          style: {
            border: '4px solid black',
            padding: '16px',
            fontWeight: '900',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
          },
        });
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.detail || 'KODE OTP SALAH ATAU KADALUARSA!';
      setErrorMsg(errorMessage);
      toast.error("Gagal Verifikasi!", {
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

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/auth/send-otp', { email: email });
      setSuccessMsg('Kode OTP berhasil dikirim ulang.');
      toast.success('Kode OTP berhasil dikirim ulang.', {
        style: {
          border: '4px solid black',
          padding: '16px',
          fontWeight: '900',
          borderRadius: '0px',
          boxShadow: '4px 4px 0px 0px #000',
        },
      });
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      const errorMessage = 'Gagal kirim ulang OTP.';
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
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1F3D] flex items-center justify-center p-6">
      <NeoCard className="w-full max-w-lg border-[6px] p-10">
        <div className="text-center mb-10">
          <div className="bg-[#F5A623] w-20 h-20 mx-auto mb-6 border-[4px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3">
            <ShieldAlert size={40} strokeWidth={3} />
          </div>
          <h2 className="text-4xl font-[900] uppercase italic tracking-tight">Two-Step Verification</h2>
          <p className="font-black text-gray-400 text-[10px] uppercase tracking-[0.3em] mt-2">OTP Verification Required</p>
        </div>

        <div className="bg-[#0F1F3D] text-white p-6 border-[4px] border-black mb-6 relative">
          <Mail size={24} className="absolute -top-4 -right-4 bg-[#F5A623] text-black p-1 border-4 border-black" />
          <p className="font-bold text-sm uppercase italic leading-tight text-center">Kode OTP dikirim ke:</p>
          <p className="font-black text-[#F5A623] text-center mt-2 break-all">{email}</p>
        </div>

        {errorMsg && (
          <div className="bg-red-400 border-4 border-black p-3 mb-6 font-black uppercase text-xs italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            ⚠ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-400 border-4 border-black p-3 mb-6 font-black uppercase text-xs italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            ✓ {successMsg}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div className="flex justify-between gap-2 mb-10" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-14 h-20 text-center text-4xl font-[900] border-[4px] border-black bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:bg-[#F5A623] focus:outline-none transition-all"
              />
            ))}
          </div>

          <NeoButton 
            type="submit"
            variant="gold" 
            className="w-full py-5 flex justify-center items-center gap-4 text-xl"
            disabled={loading}
          >
            {loading ? 'VERIFYING...' : 'VERIFY & ENTER'}
          </NeoButton>
        </form>

        <div className="mt-8 text-center">
          <button onClick={handleResend} disabled={resendLoading || resendCooldown > 0}
            className="flex items-center justify-center gap-2 mx-auto font-black uppercase text-xs tracking-widest underline decoration-2 hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            <RotateCcw size={14} />
            {resendCooldown > 0 ? `Kirim ulang dalam ${resendCooldown}s` : resendLoading ? 'Mengirim...' : 'Tidak dapat kode? Kirim Ulang'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button onClick={() => navigate('/login')} className="font-bold text-[10px] uppercase text-gray-400 hover:text-black transition-all italic">
            ← Kembali ke Login
          </button>
        </div>
      </NeoCard>
    </div>
  );
};