import { useNavigate } from 'react-router-dom';
import { NeoButton, NeoCard } from '../components/ui/NeoUI';
import {
  ShieldCheck,
  Zap,
  BarChart3,
  Bot,
  ArrowRight,
  Building2,
  LogIn,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0F1F3D] text-white font-sans overflow-x-hidden">

      {/* 1. NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#0F1F3D]/90 backdrop-blur-md border-b-4 border-black px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-[900] italic text-[#F5A623] tracking-tighter uppercase">
            APARTKU.
          </h1>
          <div className="hidden md:flex gap-8 font-black uppercase text-xs tracking-widest">
            <a href="#features" className="hover:text-[#F5A623] transition-colors">Features</a>
            <a href="#workflow" className="hover:text-[#F5A623] transition-colors">Workflow</a>
            <a href="#ai" className="hover:text-[#F5A623] transition-colors">AI Analysis</a>
          </div>
          <NeoButton
            className="py-2 px-6 text-xs flex items-center gap-2"
            onClick={() => navigate('/login')}
          >
            <LogIn size={16} /> Login Portal
          </NeoButton>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative max-w-7xl mx-auto px-8 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="z-10">
          <div className="inline-block bg-[#F5A623] text-black font-black px-4 py-1 border-4 border-black mb-6 rotate-[-2deg] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase italic text-sm">
            v1.0 AI-Powered Management
          </div>
          <h2 className="text-7xl md:text-9xl font-[900] uppercase italic leading-[0.8] tracking-tighter mb-8">
            REVOLUSI <br />
            <span className="text-[#F5A623] underline decoration-[12px]">KONTROL</span> <br />
            GEDUNG.
          </h2>
          <p className="text-xl font-bold italic mb-10 text-gray-400 uppercase tracking-tight max-w-md">
            Satu-satunya ekosistem apartemen dengan verifikasi KYC otomatis, Penagihan Massal, dan Analisis Sentimen AI.
          </p>
          <div className="flex flex-wrap gap-6">
            <NeoButton
              className="text-2xl px-12 py-6 flex items-center gap-4"
              onClick={() => navigate('/login')}
            >
              Masuk ke Portal <ArrowRight size={32} strokeWidth={3} />
            </NeoButton>
          </div>
          <p className="mt-6 text-[11px] font-bold uppercase text-gray-500 italic">
            * Akun Owner disiapkan oleh Super Admin sistem Anda.
          </p>
        </div>

        {/* Hero Decor */}
        <div className="relative">
          <NeoCard className="bg-[#F5A623] p-2 rotate-3 shadow-[20px_20px_0px_0px_#000]">
            <div className="bg-white p-8 border-4 border-black -rotate-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-4 mb-6 border-b-4 border-black pb-4">
                <div className="w-12 h-12 bg-[#0F1F3D] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"></div>
                <div className="font-black text-black uppercase">
                  <p className="text-[10px] opacity-50">Admin Analytics</p>
                  <p className="text-lg leading-none italic">Revenue Overview</p>
                </div>
              </div>
              <div className="h-40 bg-gray-100 border-4 border-black flex items-end p-4 gap-2">
                <div className="bg-[#0F1F3D] w-full h-[40%] border-2 border-black"></div>
                <div className="bg-[#F5A623] w-full h-[80%] border-2 border-black"></div>
                <div className="bg-[#0F1F3D] w-full h-[60%] border-2 border-black"></div>
                <div className="bg-[#F5A623] w-full h-[95%] border-2 border-black"></div>
              </div>
              <p className="mt-4 font-black text-black text-center text-xl italic uppercase">
                Growth +420%
              </p>
            </div>
          </NeoCard>
          <div className="absolute -bottom-10 -left-10 bg-white border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-12">
            <Bot size={48} className="text-[#0F1F3D] mb-2" />
            <p className="text-black font-black text-[10px] uppercase">
              AI Sentiment: <span className="text-green-600">Positive</span>
            </p>
          </div>
        </div>
      </section>

      {/* 3. STATS */}
      <section className="bg-[#F5A623] border-y-8 border-black py-12 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-black">
          {[
            { value: '120+', label: 'Buildings Managed' },
            { value: '85k', label: 'Active Tenants' },
            { value: '99%', label: 'KYC Accuracy' },
            { value: '24/7', label: 'AI Support' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <h3 className="text-6xl font-black italic tracking-tighter">{stat.value}</h3>
              <p className="font-black uppercase text-xs tracking-widest italic opacity-70">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-8 py-32">
        <h2 className="text-6xl font-black uppercase italic tracking-tighter mb-20 text-center">
          CORE <span className="text-[#F5A623] underline decoration-8">ECOSYSTEM.</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <FeatureCard
            icon={<ShieldCheck size={40} />}
            title="KYC Verification"
            desc="Verifikasi identitas tenant otomatis menggunakan Face Match & OCR KTP yang terintegrasi langsung ke sistem admin."
            color="bg-white"
          />
          <FeatureCard
            icon={<Zap size={40} />}
            title="Mass Billing"
            desc="Kirim tagihan IPL, Listrik, & Air ke ribuan unit dalam hitungan detik via WhatsApp & Midtrans Integration."
            color="bg-[#F5A623]"
          />
          <FeatureCard
            icon={<BarChart3 size={40} />}
            title="AI Sentiment"
            desc="Dapatkan laporan kebahagiaan penghuni dari data YouTube, media sosial, dan komplain tenant secara real-time."
            color="bg-white"
          />
        </div>
      </section>

      {/* 5. WORKFLOW */}
      <section id="workflow" className="bg-white py-32 px-8 text-black border-y-8 border-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-6xl font-black uppercase italic tracking-tighter mb-20">
            How it{' '}
            <span className="bg-[#F5A623] px-4 border-4 border-black">Works.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Step number="01" title="Super Admin Setup" desc="Super Admin membuat akun Owner dan mengkonfigurasi gedung di platform." />
            <Step number="02" title="Owner Onboarding" desc="Owner login dan mendaftarkan penghuni ke sistem ApartKu." />
            <Step number="03" title="Auto Billing" desc="Sistem otomatis mengirim tagihan bulanan ke setiap akun tenant." />
            <Step number="04" title="Growth Analytics" desc="Pantau performa gedung dan kepuasan penghuni lewat dashboard." />
          </div>
        </div>
      </section>

      {/* 6. ROLE INFO SECTION */}
      <section className="max-w-7xl mx-auto px-8 py-24">
        <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-12 text-center">
          Dua <span className="text-[#F5A623]">Role</span>, Satu Ekosistem.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <NeoCard className="bg-[#0F1F3D] text-white border-4 border-black">
            <div className="bg-[#F5A623] text-black p-4 inline-block border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
              <ShieldCheck size={40} />
            </div>
            <h4 className="text-2xl font-black uppercase italic mb-2">Super Admin</h4>
            <p className="text-xs font-bold uppercase text-gray-400 italic mb-4">Developer / Platform Manager</p>
            <ul className="space-y-2 text-sm font-bold uppercase">
              <li className="flex items-center gap-2"><span className="text-[#F5A623]">✓</span> Bisa register akun sendiri</li>
              <li className="flex items-center gap-2"><span className="text-[#F5A623]">✓</span> Buat & kelola akun Owner</li>
              <li className="flex items-center gap-2"><span className="text-[#F5A623]">✓</span> Akses semua data global</li>
              <li className="flex items-center gap-2"><span className="text-[#F5A623]">✓</span> Verifikasi KYC Tenant</li>
            </ul>
          </NeoCard>

          <NeoCard className="bg-white text-black border-4 border-black">
            <div className="bg-[#0F1F3D] text-white p-4 inline-block border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
              <Building2 size={40} />
            </div>
            <h4 className="text-2xl font-black uppercase italic mb-2">Owner / Pemilik</h4>
            <p className="text-xs font-bold uppercase text-gray-500 italic mb-4">Pemilik / Pengelola Gedung</p>
            <ul className="space-y-2 text-sm font-bold uppercase">
              <li className="flex items-center gap-2"><span className="text-[#0F1F3D]">✓</span> Akun dibuat oleh Super Admin</li>
              <li className="flex items-center gap-2"><span className="text-[#0F1F3D]">✓</span> Kelola data penghuni gedung</li>
              <li className="flex items-center gap-2"><span className="text-[#0F1F3D]">✓</span> Kirim mass billing tagihan</li>
              <li className="flex items-center gap-2"><span className="text-[#0F1F3D]">✓</span> Pantau laporan kerusakan</li>
            </ul>
          </NeoCard>
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="py-40 px-8 text-center bg-[#0F1F3D] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none italic font-black text-[20vw] select-none leading-none">
          APARTKU APARTKU
        </div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-7xl font-black uppercase italic tracking-tighter mb-10 leading-none">
            SIAP UNTUK <span className="text-[#F5A623]">UPGRADE</span> MANAGEMENT?
          </h2>
          <p className="text-xl font-bold uppercase mb-12 text-gray-400">
            Join 100+ Management Gedung yang sudah beralih ke ApartKu.
          </p>
          <NeoButton className="text-4xl px-16 py-8" onClick={() => navigate('/login')}>
            MASUK SEKARANG
          </NeoButton>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-black py-12 px-8 border-t-8 border-[#F5A623]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="font-black uppercase italic text-gray-500">
            © 2024 ApartKu Ecosystem. All Rights Reserved.
          </p>
          <div className="flex gap-8 font-black uppercase text-xs tracking-widest text-[#F5A623]">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">API Docs</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

// ─── HELPER COMPONENTS ───

const FeatureCard = ({ icon, title, desc, color }: any) => (
  <NeoCard className={`${color} text-black border-4 border-black hover:-translate-y-2 transition-transform`}>
    <div className="bg-black text-white p-4 inline-block border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
      {icon}
    </div>
    <h4 className="text-2xl font-black uppercase italic mb-4 tracking-tighter">{title}</h4>
    <p className="font-bold text-gray-600 uppercase text-xs italic leading-relaxed">{desc}</p>
  </NeoCard>
);

const Step = ({ number, title, desc }: any) => (
  <div className="border-4 border-black p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-gray-50">
    <div className="text-6xl font-[900] text-[#F5A623] italic mb-4 leading-none">{number}</div>
    <h4 className="text-xl font-black uppercase mb-2 tracking-tighter">{title}</h4>
    <p className="text-xs font-bold uppercase italic text-gray-500">{desc}</p>
  </div>
);