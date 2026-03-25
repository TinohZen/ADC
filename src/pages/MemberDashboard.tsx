import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Search, MapPin, X, Phone, Mail, TrendingUp, Loader2, UserCheck } from 'lucide-react';
import { apiFetch } from '../lib/apiFetch';

export default function MemberDashboard() {
  const [activeTab, setActiveTab] = useState<'meetings' | 'members'>('meetings');
  const [meetings, setMeetings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalMembers: 0, totalMeetings: 0, averageAttendance: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const s = await (await apiFetch('/api/stats')).json();
      setStats(s);
      if (activeTab === 'meetings') {
        setMeetings(await (await apiFetch('/api/meetings')).json());
      } else {
        const data = await (await apiFetch('/api/users')).json();
        setUsers(data.filter((u: any) => u.status === 'approved'));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filteredUsers = users.filter(u => 
    (u.first_name + u.last_name + (u.district || '')).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Espace Membre</h2>
          <p className="text-emerald-600 font-bold text-xs uppercase tracking-[0.3em] mt-1">ADC Madagascar</p>
        </div>
        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200/50 w-full sm:w-auto">
          <button onClick={() => setActiveTab('meetings')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'meetings' ? 'bg-white text-emerald-600 shadow-xl' : 'text-slate-500'}`}>RÉUNIONS</button>
          <button onClick={() => setActiveTab('members')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'members' ? 'bg-white text-emerald-600 shadow-xl' : 'text-slate-500'}`}>MEMBRES</button>
        </div>
      </div>

      {/* STATISTIQUES (Identique à l'admin mais sans "En attente") */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard label="Total Membres" val={stats.totalMembers} icon={<Users/>} color="emerald" />
        <StatCard label="Réunions" val={stats.totalMeetings} icon={<Calendar/>} color="blue" />
        <StatCard label="% Présence Global" val={`${stats.averageAttendance}%`} icon={<TrendingUp/>} color="purple" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-emerald-500"/></div>
      ) : activeTab === 'meetings' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((m) => (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={m.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
               <h3 className="font-black text-slate-800 text-lg mb-4 line-clamp-1">{m.title}</h3>
               <div className="flex gap-4 text-[10px] font-black text-slate-400 mb-6 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5"><Calendar size={14} className="text-emerald-500"/> {format(new Date(m.date), 'dd/MM/yyyy')}</div>
                  <div className="flex items-center gap-1.5"><Clock size={14} className="text-emerald-500"/> {m.time}</div>
               </div>
               <Link to={`/meetings/${m.id}`} className="block text-center py-3 bg-slate-50 text-emerald-600 rounded-xl font-black text-xs hover:bg-emerald-600 hover:text-white transition-all uppercase tracking-widest">Voir les détails</Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input type="text" placeholder="Chercher un collègue, un district..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] outline-none shadow-sm focus:border-emerald-500 transition-all font-bold text-slate-700" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((u) => (
              <motion.div whileHover={{ y: -5 }} key={u.id} onClick={() => setSelectedUser(u)} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 flex items-center gap-5 cursor-pointer hover:shadow-2xl transition-all group">
                {u.photo_url ? (
                  <img src={u.photo_url} className="w-16 h-16 rounded-[1.5rem] object-cover border-4 border-slate-50 shadow-md group-hover:scale-110 transition-transform" />
                ) : (
                  <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 flex items-center justify-center border-4 border-white shadow-md">
                    <img src="/logoADC.png" className="w-10 h-10 opacity-40 grayscale" alt="ADC" />
                  </div>
                )}
                <div>
                  <div className="font-black text-slate-800 text-sm uppercase">{u.first_name} {u.last_name}</div>
                  <div className="text-[9px] text-emerald-600 font-bold uppercase flex items-center gap-1 mt-1 tracking-wider"><MapPin size={10}/> {u.district || u.region}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS - IDENTIQUE POUR TOUS */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg p-10 relative overflow-hidden">
              <button onClick={() => setSelectedUser(null)} className="absolute top-8 right-8 p-3 bg-slate-50 text-slate-400 hover:text-slate-800 rounded-full transition-all"><X size={24} /></button>
              
              <div className="flex flex-col items-center mb-10 text-center">
                {selectedUser.photo_url ? (
                    <img src={selectedUser.photo_url} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-emerald-50 shadow-2xl mb-6" />
                ) : (
                    <div className="w-32 h-32 rounded-[2.5rem] bg-emerald-50 flex items-center justify-center border-4 border-white shadow-2xl mb-6">
                        <img src="/logoADC.png" className="w-20 h-20 opacity-30" />
                    </div>
                )}
                <h2 className="text-2xl font-black text-slate-800 leading-tight uppercase">{selectedUser.first_name} <br/> {selectedUser.last_name}</h2>
                <div className="mt-4 px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <UserCheck size={12}/> MEMBRE ADC ACTIF
                </div>
              </div>

              <div className="bg-slate-50 p-8 rounded-[2.5rem] space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Téléphone</p><p className="text-sm font-bold text-slate-700">{selectedUser.phone}</p></div>
                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p><p className="text-sm font-bold text-slate-700 truncate">{selectedUser.email || 'N/A'}</p></div>
                </div>
                <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-y-4 gap-x-6">
                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Province</p><p className="text-xs font-bold text-slate-700 uppercase">{selectedUser.province}</p></div>
                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Région</p><p className="text-xs font-bold text-slate-700 uppercase">{selectedUser.region}</p></div>
                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">District</p><p className="text-xs font-bold text-slate-700 uppercase">{selectedUser.district}</p></div>
                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Commune</p><p className="text-xs font-bold text-slate-700 uppercase">{selectedUser.commune}</p></div>
                    <div className="col-span-2"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fokontany</p><p className="text-xs font-bold text-slate-700 uppercase">{selectedUser.fokontany}</p></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



function StatCard({ icon, label, val, color }: any) {
    return (
        <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-2xl transition-all">
            <div className={`w-14 h-14 rounded-2xl bg-${color}-50 text-${color}-600 flex items-center justify-center shadow-inner`}>{icon}</div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{val}</h2>
            </div>
        </div>
    );
}