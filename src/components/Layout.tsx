import { useState } from 'react';
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
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <img src="/logoADC.png" alt="ADC" className="w-10 h-10 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; document.getElementById('logo-fallback-layout')!.style.display = 'flex'; }} />
          <div id="logo-fallback-layout" className="hidden w-10 h-10 bg-emerald-600 text-white rounded-xl items-center justify-center font-bold">ADC</div>
          <h1 className="font-bold text-slate-800 hidden sm:block">Association Dévoir et Citoyen</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div onClick={() => navigate('/profile')} className="flex items-center gap-3 bg-slate-100 p-1.5 pr-4 rounded-full cursor-pointer hover:bg-slate-200 transition-all">
            <img src={user.photo_url || '/placeholder.png'} className="w-7 h-7 rounded-full object-cover shadow-sm" />
            <span className="text-xs font-bold text-slate-700 hidden sm:block">{user.first_name} {user.last_name}</span>
          </div>
          <button onClick={() => setIsLogoutModalOpen(true)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><LogOut size={20} /></button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto p-4 sm:p-8 w-full">
        <Outlet />
      </main>
      

      <ConfirmModal isOpen={isLogoutModalOpen} title="Déconnexion" message="Voulez-vous quitter votre session ?" confirmText="Quitter" type="danger" onConfirm={() => { localStorage.clear(); navigate('/login'); }} onCancel={() => setIsLogoutModalOpen(false)} />
    </div>
  );
}