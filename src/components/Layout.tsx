import { useState, useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LogOut, User, LayoutDashboard, Calendar, UserCheck, Bell, PlayCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, parseISO, differenceInHours, differenceInMinutes, isTomorrow, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/apiFetch';
import ConfirmModal from './ConfirmModal';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
  const [dbNotifications, setDbNotifications] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const userStr = localStorage.getItem('adc_user');
  if (!userStr) return <Navigate to="/login" replace />;
  const user = JSON.parse(userStr);

  const isCurrent = (path: string) => location.pathname === path && !location.search;

  useEffect(() => {
    // 1. Charger datas
    apiFetch('/api/notifications').then(res => res.json()).then(data => setDbNotifications(data || [])).catch(console.error);
    apiFetch('/api/meetings').then(res => res.json()).then(data => setMeetings(data || [])).catch(console.error);

    // 2. Écoute Temps Réel WebSockets
    const channel = supabase.channel('realtime-notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        setDbNotifications((prev) => [payload.new, ...prev]);
      }).subscribe();

    // 3. 📱 ACTIVATION DES PUSH NOTIFICATIONS (FIREBASE / CAPACITOR)
    if (Capacitor.isNativePlatform()) {
      PushNotifications.requestPermissions().then(result => {
        if (result.receive === 'granted') {
          PushNotifications.register();
        }
      });

      // Quand on reçoit le jeton du téléphone, on l'envoie à ton backend
      PushNotifications.addListener('registration', async (token) => {
        await apiFetch(`/api/users/${user.id}/fcm-token`, {
          method: 'PUT',
          body: JSON.stringify({ token: token.value })
        }).catch(console.error);
      });

      // Actions quand on clique sur la pop-up Push Android/iOS
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        navigate('/dashboard'); 
      });
    }

    return () => { supabase.removeChannel(channel); };
  }, [user.id]);

  // 4. MOTEUR D'ALERTES DE RÉUNIONS INTELLIGENT
  const smartAlerts = useMemo(() => {
    const alerts: any[] = [];
    const now = new Date();

    meetings.forEach(m => {
      const meetingDate = parseISO(`${m.date}T${m.time}`);
      const diffMinutes = differenceInMinutes(meetingDate, now);
      const diffHours = differenceInHours(meetingDate, now);

      if (diffMinutes <= 0 && diffMinutes > -120) {
        alerts.push({
          id: `alert-now-${m.id}`, is_alert: true, urgency: 'danger', title: '🚨 RÉUNION EN COURS !',
          message: `${m.title} a commencé. Rejoignez le salon vocal immédiatement.`, link: `/meetings/${m.id}/room`, icon: <PlayCircle size={18} className="text-white" />
        });
      } else if (diffMinutes > 0 && diffHours < 2) {
        alerts.push({
          id: `alert-soon-${m.id}`, is_alert: true, urgency: 'warning', title: '⏳ RÉUNION IMMINENTE',
          message: `${m.title} commence dans ${diffMinutes} minutes ! Préparez-vous.`, link: `/meetings/${m.id}`, icon: <Clock size={18} className="text-white" />
        });
      } else if (diffHours >= 2 && (isToday(meetingDate) || isTomorrow(meetingDate))) {
        alerts.push({
          id: `alert-tomorrow-${m.id}`, is_alert: true, urgency: 'info', title: '📅 RAPPEL DE RÉUNION',
          message: `${m.title} est prévue pour ${isToday(meetingDate) ? "aujourd'hui" : "demain"} à ${m.time}.`, link: `/meetings/${m.id}`, icon: <Calendar size={18} className="text-white" />
        });
      }
    });
    return alerts;
  }, [meetings]);

  const allNotifications = [...smartAlerts, ...dbNotifications];
  const unreadCount = dbNotifications.filter(n => !n.is_read).length + smartAlerts.length;

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_alert && !notif.is_read) {
      await apiFetch(`/api/notifications/${notif.id}/read`, { method: 'PUT' });
      setDbNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }
    setShowNotifPanel(false);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20 sm:pb-0">
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-100 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 lg:px-8 transition-all">
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none" onClick={() => navigate('/dashboard')}>
          <img src="/logoADC.png" alt="ADC" className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0" />
          <div className="leading-tight">
            <h1 className="font-extrabold text-slate-800 text-xs sm:text-sm md:text-base tracking-tight truncate max-w-[170px] sm:max-w-none">
              Association Devoir & Citoyen
            </h1>
            <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest hidden sm:block">
              République de Madagascar
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 relative">
          
          <button 
            onClick={() => setShowNotifPanel(!showNotifPanel)}
            className="relative p-2.5 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer"
          >
            <Bell size={19} className={unreadCount > 0 ? 'animate-[wiggle_1s_ease-in-out_infinite]' : ''} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm shadow-rose-500/40 border border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div onClick={() => navigate('/profile')} className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 p-1 sm:pr-3.5 rounded-full cursor-pointer border border-slate-100 transition-all">
            {user.photo_url && user.photo_url !== 'EMPTY' ? (
              <img src={user.photo_url} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shadow-xs border border-white" />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                {user.first_name?.[0]}
              </div>
            )}
            <span className="text-xs font-extrabold text-slate-700 hidden md:block">{user.first_name}</span>
          </div>

          <button onClick={() => setIsLogoutModalOpen(true)} className="w-8 h-8 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer">
            <LogOut size={17} />
          </button>

          <AnimatePresence>
            {showNotifPanel && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifPanel(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-14 right-0 w-80 sm:w-96 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 overflow-hidden"
                >
                  <div className="bg-slate-900 p-5 flex items-center justify-between">
                    <h4 className="text-white font-black text-sm uppercase tracking-wider">Centre d'Alertes</h4>
                    {unreadCount > 0 && <span className="text-[10px] bg-emerald-500 text-white px-2.5 py-1 rounded-full font-bold">{unreadCount} nouvelle(s)</span>}
                  </div>
                  <div className="max-h-[450px] overflow-y-auto bg-slate-50 p-2.5 space-y-2">
                    {allNotifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                        Rien à signaler
                      </div>
                    ) : (
                      allNotifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotificationClick(n)}
                          className={`p-4 rounded-2xl cursor-pointer transition-all flex gap-3 ${
                            n.is_alert 
                              ? n.urgency === 'danger' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' 
                              : n.urgency === 'warning' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                              : 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                            : n.is_read ? 'bg-transparent hover:bg-slate-100' : 'bg-white shadow-sm border border-emerald-100'
                          }`}
                        >
                          {n.is_alert && <div className="mt-0.5 shrink-0">{n.icon}</div>}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-4">
                              <h5 className={`text-xs font-black uppercase ${
                                n.is_alert ? 'text-white' : n.is_read ? 'text-slate-600' : 'text-emerald-600'
                              }`}>{n.title}</h5>
                              {!n.is_read && !n.is_alert && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1 shadow-sm shadow-emerald-500/50"></span>}
                            </div>
                            <p className={`text-xs font-medium leading-relaxed mt-1 ${n.is_alert ? 'text-white/90' : 'text-slate-500'}`}>
                              {n.message}
                            </p>
                            {!n.is_alert && (
                              <span className="text-[9px] font-bold text-slate-400 mt-2 block">
                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 lg:p-8 transition-all">
        <Outlet />
      </main>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-slate-200/80 px-4 py-2 flex items-center justify-around shadow-2xl">
        <button onClick={() => navigate('/dashboard')} className={`flex flex-col items-center gap-0.5 p-1.5 transition-all ${isCurrent('/dashboard') || isCurrent('/') ? 'text-emerald-600 scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'}`}>
          <LayoutDashboard size={19} />
          <span className="text-[9px] font-black uppercase tracking-wider">Accueil</span>
        </button>
        <button onClick={() => navigate('/dashboard?tab=meetings')} className={`flex flex-col items-center gap-0.5 p-1.5 transition-all ${location.search.includes('tab=meetings') ? 'text-emerald-600 scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'}`}>
          <Calendar size={19} />
          <span className="text-[9px] font-black uppercase tracking-wider">Réunions</span>
        </button>
        <button onClick={() => navigate('/profile')} className={`flex flex-col items-center gap-0.5 p-1.5 transition-all ${isCurrent('/profile') ? 'text-emerald-600 scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'}`}>
          <UserCheck size={19} />
          <span className="text-[9px] font-black uppercase tracking-wider">Profil</span>
        </button>
      </nav>

      <ConfirmModal isOpen={isLogoutModalOpen} title="Déconnexion" message="Voulez-vous quitter votre session ?" confirmText="Quitter" type="danger" onConfirm={() => { localStorage.clear(); navigate('/login'); }} onCancel={() => setIsLogoutModalOpen(false)} />
    </div>
  );
}