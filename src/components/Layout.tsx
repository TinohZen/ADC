import React, { useState } from 'react';
import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import ConfirmModal from './ConfirmModal';

export default function Layout() {
  const navigate = useNavigate();
  const[isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const userStr = localStorage.getItem('adc_user');
  
  if (!userStr) return <Navigate to="/login" replace />;
  const user = JSON.parse(userStr);

  const handleLogout = () => {
    localStorage.removeItem('adc_user');
    localStorage.removeItem('adc_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 h-16 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-emerald-200 group-hover:rotate-6 transition-transform">ADC</div>
            <h1 className="font-extrabold text-slate-800 hidden sm:block tracking-tight text-sm uppercase">Dévoir et Citoyen</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/profile')} className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 pr-4 rounded-full cursor-pointer hover:border-emerald-300 transition-all shadow-sm">
              <img src={user.photo_url || '/placeholder.png'} className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-50" />
              <span className="text-[11px] font-bold text-slate-700 hidden sm:block uppercase tracking-wider">{user.first_name}</span>
            </motion.div>
            <button onClick={() => setIsLogoutModalOpen(true)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><LogOut size={20} /></button>
          </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto p-4 sm:p-8 w-full">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><Outlet /></motion.div>
      </main>

      <ConfirmModal 
        isOpen={isLogoutModalOpen}
        title="Déconnexion"
        message="Voulez-vous vraiment quitter votre session ADC ?"
        confirmText="Oui, Quitter"
        type="danger"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
}