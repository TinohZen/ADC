import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LogOut, User, LayoutDashboard, Calendar, CreditCard, UserCheck } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const userStr = localStorage.getItem('adc_user');
  if (!userStr) return <Navigate to="/login" replace />;
  const user = JSON.parse(userStr);

  const isCurrent = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20 sm:pb-0">
      {/* HEADER HAUT (ADAPTATIF PC / TABLETTE / MOBILE) */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-100 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 lg:px-8 transition-all">
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none" onClick={() => navigate('/')}>
          <img 
            src="/logoADC.png" 
            alt="ADC" 
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0" 
            onError={(e) => { 
              e.currentTarget.style.display = 'none'; 
              document.getElementById('logo-fallback-layout')!.style.display = 'flex'; 
            }} 
          />
          <div id="logo-fallback-layout" className="hidden w-8 h-8 sm:w-10 sm:h-10 bg-emerald-700 text-white rounded-xl items-center justify-center font-black text-xs">
            ADC
          </div>
          <div className="leading-tight">
            <h1 className="font-extrabold text-slate-800 text-xs sm:text-sm md:text-base tracking-tight truncate max-w-[170px] sm:max-w-none">
              Association Devoir & Citoyen
            </h1>
            <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest hidden sm:block">
              République de Madagascar
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div 
            onClick={() => navigate('/profile')} 
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 p-1 sm:pr-3.5 rounded-full cursor-pointer border border-slate-100 transition-all"
          >
            {user.photo_url && user.photo_url !== 'EMPTY' ? (
              <img src={user.photo_url} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shadow-xs border border-white" />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                <User size={14} />
              </div>
            )}
            <span className="text-xs font-extrabold text-slate-700 hidden md:block">
              {user.first_name} {user.last_name}
            </span>
          </div>

          <button 
            onClick={() => setIsLogoutModalOpen(true)} 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
            title="Déconnexion"
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {/* CONTENU PRINCIPAL AVEC PADDING FLUIDE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 lg:p-8 transition-all">
        <Outlet />
      </main>

      {/* BARRE DE NAVIGATION MOBILE FLOTTANTE (STYLE IONIC / IOS) - VISIBLE UNIQUEMENT SUR MOBILE */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-slate-200/80 px-4 py-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => navigate('/dashboard')}
          className={`flex flex-col items-center gap-0.5 p-1.5 transition-all cursor-pointer ${
            isCurrent('/dashboard') || isCurrent('/') ? 'text-emerald-600 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard size={19} />
          <span className="text-[9px] font-black uppercase tracking-wider">Accueil</span>
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          className="flex flex-col items-center gap-0.5 p-1.5 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
        >
          <Calendar size={19} />
          <span className="text-[9px] font-black uppercase tracking-wider">Réunions</span>
        </button>

        <button
          onClick={() => navigate('/profile')}
          className={`flex flex-col items-center gap-0.5 p-1.5 transition-all cursor-pointer ${
            isCurrent('/profile') ? 'text-emerald-600 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <UserCheck size={19} />
          <span className="text-[9px] font-black uppercase tracking-wider">Profil</span>
        </button>
      </nav>

      <ConfirmModal 
        isOpen={isLogoutModalOpen} 
        title="Déconnexion" 
        message="Voulez-vous quitter votre session ?" 
        confirmText="Quitter" 
        type="danger" 
        onConfirm={() => { localStorage.clear(); navigate('/login'); }} 
        onCancel={() => setIsLogoutModalOpen(false)} 
      />
    </div>
  );
}