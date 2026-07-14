import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  BarChart2,
  LogOut,
  Building2,
  Receipt,
  Settings,
  Bell,
  User,
} from 'lucide-react';

import { NeoCard } from '../components/ui/NeoUI';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export const MainLayout = ({
  children,
  role,
}: {
  children: ReactNode;
  role: 'super_admin' | 'owner';
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const superAdminMenu = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/super-admin/dashboard' },
    { label: 'Verifikasi User ', icon: UserCheck, path: '/super-admin/users' },
    { label: 'Manajemen Owner', icon: Users, path: '/super-admin/owners' },
    { label: 'YouTube Analytics', icon: BarChart2, path: '/super-admin/youtube' },
  ];

  const ownerMenu = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/owner/dashboard' },
    { label: 'Unit Management', icon: Building2, path: '/owner/units' },
    { label: 'Data Penghuni', icon: Users, path: '/owner/tenants' },
    { label: 'Mass Billing', icon: Receipt, path: '/owner/billing' },
    { label: 'AI Maintenance', icon: Settings, path: '/owner/maintenance' },
    { label: 'Broadcast Info', icon: Bell, path: '/owner/broadcast' },
    { label: 'Account Profile', icon: User , path: '/owner/profile' }
  ];

  const menu = role === 'super_admin' ? superAdminMenu : ownerMenu;

  // Fungsi logout yang sudah diperbaiki
  const handleLogout = async () => {
    // Confirm ala Neo-Brutalism
    if (window.confirm("KELUAR DARI SISTEM APARTKU?")) {
      try {
        await signOut(auth);
        
        // ✅ WAJIB: Buang kuncinya biar gak bisa masuk lagi tanpa login
        localStorage.removeItem('otp_verified');
        
        // Gunakan window.location agar state benar-benar bersih total
        window.location.href = "/login"; 
      } catch (error) {
        console.error("Gagal Logout:", error);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0F1F3D] p-6 gap-6 font-sans text-white">

      <aside className="w-72 flex flex-col gap-4">

        <NeoCard className="bg-[#F5A623] border-black p-6">
          <h1 className="text-2xl font-[900] italic tracking-tighter text-black leading-none uppercase">
            APARTKU.
          </h1>

          <p className="text-[10px] font-black uppercase mt-1 text-black/60 italic">
            {role === 'super_admin' ? 'Super Admin Panel' : 'Owner Panel'}
          </p>
        </NeoCard>

        <nav className="flex-1 space-y-3">
          {menu.map((item, i) => (
            <div
              key={i}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-4 p-4 border-4 border-black font-black uppercase text-xs cursor-pointer transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
              ${location.pathname === item.path
                ? 'bg-[#F5A623] text-black translate-x-1 translate-y-1 shadow-none'
                : 'bg-white text-black hover:bg-[#F5A623]/50'
              }`}
            >
              <item.icon size={20} strokeWidth={3} />
              {item.label}
            </div>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 p-4 border-4 border-black bg-red-500 text-white font-[900] uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
        >
          <LogOut size={20} strokeWidth={3} />
          Logout System
        </button>

      </aside>

      <main className="flex-1 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 text-black overflow-auto">

        <header className="mb-8 border-b-4 border-black pb-4 flex justify-between items-center">

          <h2 className="text-4xl font-[900] uppercase italic tracking-tighter leading-none">
            {menu.find(m => m.path === location.pathname)?.label || 'Overview'}
          </h2>

          <div className="text-right border-l-4 border-black pl-4">
            <p className="font-black text-xs uppercase">
              {role === 'super_admin' ? 'Super Admin' : 'Owner'}
            </p>

            <p className="text-[10px] font-bold text-green-600 uppercase italic leading-none">
              ● Status: Online
            </p>
          </div>

        </header>

        {children}

      </main>
    </div>
  );
};