import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadCloud, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import MemberDashboard from './pages/MemberDashboard';
import MeetingDetails from './pages/MeetingDetails';
import Layout from './components/Layout';
import Profile from './pages/Profile';
import AudioRoom from './pages/AudioRoom';

// La version ACTUELLE de cette application compilée
const APP_VERSION = "1.0.0";

function BootLoader({ onReady }: { onReady: () => void }) {
  const [status, setStatus] = useState('Vérification des accès...');
  const [updateData, setUpdateData] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. On interroge le serveur pour voir s'il y a une mise à jour
        const res = await fetch('https://adc-reunion.vercel.app/api/version', { cache: 'no-store' });
        const data = await res.json();

        // 2. Si la version du serveur est différente de la version locale, on déclenche la MAJ
        if (data.version !== APP_VERSION && Capacitor.isNativePlatform()) {
          setUpdateData(data);
          setStatus(`Version ${data.version} disponible !`);
        } else {
          // Lancement normal
          setTimeout(onReady, 800);
        }
      } catch (error) {
        // Mode hors-ligne ou erreur serveur, on lance l'app quand même
        setTimeout(onReady, 800);
      }
    };

    initApp();
  }, [onReady]);

  const handleDownloadUpdate = () => {
    setIsDownloading(true);
    setStatus('Téléchargement en cours...');
    // Redirige vers le fichier APK pour déclencher le téléchargement Android natif
    window.location.href = updateData.url;
    
    setTimeout(() => {
      setStatus('Ouvrez le fichier téléchargé pour installer.');
      setIsDownloading(false);
    }, 3000);
  };

  return (
    <motion.div 
      initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
      className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-8 font-sans"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950"></div>
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-32 h-32 mb-8 bg-white p-2 rounded-[2.5rem] shadow-2xl shadow-emerald-500/20 flex items-center justify-center overflow-hidden"
      >
        <img src="/logoADC.png" alt="ADC" className="w-full h-full object-contain" />
      </motion.div>
      
      <h2 className="relative z-10 text-2xl font-black text-white tracking-tight uppercase mb-2">Devoir & Citoyen</h2>
      
      <div className="relative z-10 w-full max-w-xs mt-8">
        {!updateData ? (
          <div className="flex justify-center items-center gap-2 text-emerald-400">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs font-black tracking-widest uppercase">{status}</span>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-700 p-6 rounded-3xl text-center">
            <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <DownloadCloud size={24} />
            </div>
            <h3 className="text-white font-black uppercase tracking-wider mb-2">Mise à jour requise</h3>
            <p className="text-slate-400 text-xs font-medium mb-6">
              {updateData.releaseNotes}
            </p>
            <button 
              onClick={handleDownloadUpdate}
              disabled={isDownloading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              {isDownloading ? 'Téléchargement...' : 'Mettre à jour'}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);

  return (
    <>
      <AnimatePresence>
        {!isReady && <BootLoader onReady={() => setIsReady(true)} />}
      </AnimatePresence>

      {isReady && (
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardRouter />} />
              <Route path="meetings/:id" element={<MeetingDetails />} />
              <Route path="profile" element={<Profile />} />
              <Route path="meetings/:id/room" element={<AudioRoom />} />
            </Route>
          </Routes>
        </Router>
      )}
    </>
  );
}

function DashboardRouter() {
  const userStr = localStorage.getItem('adc_user');
  const [searchParams] = useSearchParams();
  if (!userStr) return <Navigate to="/login" replace />;
  
  const user = JSON.parse(userStr);
  const initialTab = searchParams.get('tab') === 'meetings' ? 'meetings' : undefined;

  if (user.role === 'admin' || user.role === 'chef') {
    return <AdminDashboard initialTab={initialTab} />;
  }
  return <MemberDashboard initialTab={initialTab} />;
}