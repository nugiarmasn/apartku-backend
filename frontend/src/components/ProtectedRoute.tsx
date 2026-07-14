import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: 'super_admin' | 'owner';
}

type AuthStatus = 'loading' | 'authorized' | 'unauthorized' | 'wrong_role';

export const ProtectedRoute = ({ children, allowedRole }: ProtectedRouteProps) => {
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    // Firebase listener — cek apakah user sudah login
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || !user.email) {
        // Tidak ada session Firebase → paksa ke login
        setStatus('unauthorized');
        return;
      }

      try {
        // Cek role di Firestore sesuai allowedRole
        if (allowedRole === 'super_admin') {
          const snap = await getDoc(doc(db, 'admins', user.email));
          if (snap.exists() && snap.data().role === 'super_admin') {
            setStatus('authorized');
          } else {
            setStatus('wrong_role');
          }

        } else if (allowedRole === 'owner') {
          const snap = await getDoc(doc(db, 'owners', user.email));
          if (snap.exists() && snap.data().role === 'owner') {
            setStatus('authorized');
          } else {
            setStatus('wrong_role');
          }
        }

      } catch (err) {
        console.error('ProtectedRoute error:', err);
        setStatus('unauthorized');
      }
    });

    return () => unsubscribe();
  }, [allowedRole]);

  // ─── Render berdasarkan status ───
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0F1F3D] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-[4px] border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-black uppercase italic text-sm tracking-widest">
            Memverifikasi Akses...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'unauthorized') {
    // Belum login sama sekali → ke halaman login
    return <Navigate to="/login" replace />;
  }

  if (status === 'wrong_role') {
    // Login tapi role tidak sesuai → redirect ke halaman yang tepat
    // (misal owner coba akses super-admin area)
    return <Navigate to="/login" replace />;
  }

  // Authorized ✓
  return <>{children}</>;
};