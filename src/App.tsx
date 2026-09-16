import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadCloud, CheckCircle2 } from 'lucide-react';

import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import MemberDashboard from './pages/MemberDashboard';
import MeetingDetails from './pages/MeetingDetails';
import Layout from './components/Layout';
import Profile from './pages/Profile';
import AudioRoom from './pages/AudioRoom';

const APP_VERSION = "1.0.1";

if (Capacitor.isNativePlatform()) {
  CapacitorUpdater.notifyAppReady();
}

function BootLoader({ onReady }: { onReady: () => void }) {
  const [status, setStatus] = useState('Vérification du système...');
  const [progress, setProgress] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      if (!Capacitor.isNativePlatform()) {
        setTimeout(onReady, 1000);
        return;
      }

      try {
        CapacitorUpdater.addListener('download', (info: any) => {
          setIsUpdating(true);
          setStatus('Mise à jour en cours...');
          setProgress(Math.round(info.percent));
        });

        const versionRes = await fetch('https://adc-reunion.vercel.app/api/version', { cache: 'no-store' });
        
        if (versionRes && versionRes.ok) {
          const { version, url } = await versionRes.json();
          if (version !== APP_VERSION) {
            // Téléchargement du code source ZIP et installation silencieuse
            const bundle = await CapacitorUpdater.download({ url, version });
            setStatus('Installation terminée. Redémarrage...');
            await CapacitorUpdater.set({ id: bundle.id });
            return;
          }
        }
        setTimeout(onReady, 800);
      } catch (error) {
        setTimeout(onReady, 800);
      }
    };

    initApp();
  }, [onReady]);

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
        <img src="/logoADC.png" alt="ADC" className="w-full h-full object-contain drop-shadow-xl" />
      </motion.div>
      
      <h2 className="relative z-10 text-2xl font-black text-white tracking-tight uppercase mb-2">Devoir & Citoyen</h2>
      
      <div className="relative z-10 w-full max-w-xs mt-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-black tracking-[0.2em] text-emerald-400 uppercase flex items-center gap-2">
            {isUpdating ? <DownloadCloud size={14} className="animate-bounce" /> : <CheckCircle2 size={14} />}
            {status}
          </span>
          {isUpdating && <span className="text-xs font-bold text-white">{progress}%</span>}
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: isUpdating ? `${progress}%` : '100%' }}
            transition={{ duration: 0.3 }}
          />
        </div>
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