import { Outlet, useNavigate, Navigate } from 'react-router-dom'; // Ajoute Navigate ici
import { LogOut, User } from 'lucide-react';
import { motion } from 'framer-motion'; // Vérifie si c'est motion/react ou framer-motion selon ta version

export default function Layout() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('adc_user');
  
  // ✅ CORRECTION : Utilise le composant de redirection au lieu de la fonction navigate()
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }
  
  const user = JSON.parse(userStr);

  const handleLogout = () => {
    localStorage.removeItem('adc_user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 text-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <img 
              src="/logo_adc.png" 
              alt="ADC Logo" 
              className="w-10 h-10 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = document.getElementById('logo-fallback-layout');
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div id="logo-fallback-layout" className="hidden w-10 h-10 bg-emerald-600 text-white rounded-xl items-center justify-center font-bold text-lg shadow-sm group-hover:bg-emerald-700 transition-colors">
              ADC
            </div>
            
            <h1 className="font-semibold text-lg hidden sm:block tracking-tight">Association des Droits de Citoyen</h1>
            <h1 className="font-semibold text-lg sm:hidden tracking-tight">ADC</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200/60">
              {user.photo_url ? (
                <img src={user.photo_url} alt="Profile" className="w-7 h-7 rounded-full object-cover shadow-sm" />
              ) : (
                <div className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center">
                  <User size={14} />
                </div>
              )}
              <span className="text-sm font-medium hidden sm:block pr-1">{user.first_name} {user.last_name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Déconnexion"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}