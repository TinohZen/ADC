import React, { useState } from 'react';
import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import { LogOut, User, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import ConfirmModal from './ConfirmModal';

export default function Layout() {
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const userStr = localStorage.getItem('adc_user');
  if (!userStr) return <Navigate to="/login" replace />;
  const user = JSON.parse(userStr);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 flex items-center justify-between px-4 sm:px-10">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/')}>
          <img src="/logoADC.png" alt="ADC" className="w-14 h-14 object-contain group-hover:scale-110 transition-transform" />
          <div className="hidden sm:block">
            <h1 className="font-black text-slate-800 tracking-tighter text-lg uppercase leading-none">ADC</h1>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em]">Devoir et Citoyen</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <nav className="hidden md:flex items-center gap-1 mr-6">
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-xs font-black text-slate-600 hover:text-emerald-600 uppercase tracking-widest flex items-center gap-2"><LayoutDashboard size={16}/> Dashboard</button>
            <button onClick={() => navigate('/profile')} className="px-4 py-2 text-xs font-black text-emerald-600 bg-emerald-50 rounded-xl uppercase tracking-widest flex items-center gap-2"><User size={16}/> Mon Profil</button>
          </nav>
          <div onClick={() => navigate('/profile')} className="flex items-center gap-3 bg-white border border-slate-200 p-1.5 pr-5 rounded-2xl cursor-pointer hover:shadow-lg transition-all shadow-sm">
            <img src={user.photo_url || '/placeholder.png'} className="w-9 h-9 rounded-xl object-cover ring-2 ring-emerald-50" />
            <div className="hidden sm:block text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Session</p>
              <p className="text-xs font-bold text-slate-800 leading-none">{user.first_name}</p>
            </div>
          </div>
          <button onClick={() => setIsLogoutModalOpen(true)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><LogOut size={22} /></button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto p-4 sm:p-10 w-full">
        <Outlet />
      </main>

      <ConfirmModal 
        isOpen={isLogoutModalOpen} title="Déconnexion" message="Voulez-vous quitter votre session ADC ?" confirmText="Quitter" type="danger" 
        onConfirm={() => { localStorage.clear(); navigate('/login'); }} onCancel={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
}