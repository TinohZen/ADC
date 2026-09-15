import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import MemberDashboard from './pages/MemberDashboard';
import MeetingDetails from './pages/MeetingDetails';
import Layout from './components/Layout';
import Profile from './pages/Profile';
import AudioRoom from './pages/AudioRoom';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {initialLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
              className="w-24 h-24 sm:w-28 sm:h-28 mb-4 flex items-center justify-center"
            >
              <img src="/logoADC.png" alt="ADC" className="w-full h-full object-contain" />
            </motion.div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">Association Devoir & Citoyen</h2>
            <p className="text-[10px] font-bold tracking-[0.25em] text-emerald-600 uppercase mt-1">Chargement de l'espace membre...</p>
          </motion.div>
        )}
      </AnimatePresence>

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