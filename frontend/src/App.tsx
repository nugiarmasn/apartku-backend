import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OtpPage } from './pages/OtpPage';
import { MainLayout } from './Layout/MainLayout';
import { AdminDashboard } from './pages/super-admin/AdminDashboard';
import { UserManagement } from './pages/super-admin/UserManagement';
import { OwnerManagement } from './pages/super-admin/OwnerManagement';
import { YoutubePage } from './pages/super-admin/YoutubePage';
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { UnitManagement } from './pages/owner/UnitManagement';
import { MassBilling } from './pages/owner/MassBilling';
import { MaintenancePage } from './pages/owner/MaintenancePage';
import { BroadcastPage } from './pages/owner/BroadcastPage';
import { ProfilePage } from './pages/owner/ProfilePage';
import { TenantManagement } from './pages/owner/TenantManagement';

function App() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        try {
          const adminSnap = await getDoc(doc(db, "admins", firebaseUser.email!));
          if (adminSnap.exists()) {
            setRole('super_admin');
          } else {
            const q = query(collection(db, "owners"), where("email", "==", firebaseUser.email));
            const ownerSnap = await getDocs(q);
            if (!ownerSnap.empty) {
              setRole('owner');
            } else {
              setRole('guest');
            }
          }
        } catch (error) {
          console.error("Gagal ambil role:", error);
          setRole('guest');
        }
      } else {
        setUser(null);
        setRole(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1F3D] flex items-center justify-center">
        <div className="bg-white border-4 border-black p-8 shadow-neo animate-pulse">
          <p className="font-[900] uppercase italic text-xl tracking-tighter">
            Authenticating Session...
          </p>
        </div>
      </div>
    );
  }

  const isOtpVerified = localStorage.getItem('otp_verified') === 'true';

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            border: '4px solid black',
            padding: '16px',
            fontWeight: '900',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
            background: '#fff',
            color: '#000',
          },
        }}
      />
      
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<OtpPage />} />

          <Route path="/login" element={
            user && isOtpVerified ? (
              <Navigate to={role === 'super_admin' ? "/super-admin/dashboard" : "/owner/dashboard"} replace />
            ) : <LoginPage />
          } />

          {/* PROTECTED ROUTES: SUPER ADMIN */}
          <Route path="/super-admin/dashboard" element={
            user && role === 'super_admin' && isOtpVerified
              ? <MainLayout role="super_admin"><AdminDashboard /></MainLayout>
              : <Navigate to="/login" replace />
          } />

          <Route path="/super-admin/users" element={
            user && role === 'super_admin' && isOtpVerified
              ? <MainLayout role="super_admin"><UserManagement /></MainLayout>
              : <Navigate to="/login" replace />
          } />

          <Route path="/super-admin/owners" element={
            user && role === 'super_admin' && isOtpVerified
              ? <MainLayout role="super_admin"><OwnerManagement /></MainLayout>
              : <Navigate to="/login" replace />
          } />

          <Route path="/super-admin/youtube" element={
            user && role === 'super_admin' && isOtpVerified
              ? <MainLayout role="super_admin"><YoutubePage /></MainLayout>
              : <Navigate to="/login" replace />
          } />

          {/* PROTECTED ROUTES: OWNER */}
          <Route path="/owner/dashboard" element={
            user && role === 'owner' && isOtpVerified
              ? <MainLayout role="owner"><OwnerDashboard /></MainLayout>
              : <Navigate to="/login" replace />
          } />

          <Route path="/owner/units" element={
            user && role === 'owner' && isOtpVerified
              ? <MainLayout role="owner"><UnitManagement /></MainLayout>
              : <Navigate to="/login" replace />
          } />

          <Route path="/owner/billing" element={
            user && role === 'owner' && isOtpVerified
              ? <MainLayout role="owner"><MassBilling /></MainLayout>
              : <Navigate to="/login" replace />
          } />

          <Route path="/owner/maintenance" element={
            user && role === 'owner' && isOtpVerified
              ? <MainLayout role="owner"><MaintenancePage /></MainLayout>
              : <Navigate to="/login" replace />
          } />

          <Route path="/owner/broadcast" element={
            user && role === 'owner' && isOtpVerified
              ? <MainLayout role="owner"><BroadcastPage /></MainLayout>
              : <Navigate to="/login" replace />
          } />

          <Route path="/owner/profile" element={
            user && role === 'owner' && isOtpVerified
              ? <MainLayout role="owner"><ProfilePage /></MainLayout>
              : <Navigate to="/login" replace />
          } />

          <Route path="/owner/tenants" element={
            user && role === 'owner' && isOtpVerified
              ? <MainLayout role="owner"><TenantManagement /></MainLayout>
              : <Navigate to="/login" replace />
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;