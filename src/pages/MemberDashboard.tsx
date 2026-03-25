import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Search, MapPin, X, TrendingUp, Loader2, UserCheck, User } from 'lucide-react';
import { apiFetch } from '../lib/apiFetch';

export default function MemberDashboard() {
  const [activeTab, setActiveTab] = useState<'meetings' | 'members'>('meetings');
  const [meetings, setMeetings] = useState<any[]>([]);
  const[users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalMembers: 0, totalMeetings: 0, averageAttendance: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await apiFetch('/api/stats');
      setStats(await statsRes.json());
      if (activeTab === 'meetings') {
        const res = await apiFetch('/api/meetings');
        setMeetings(await res.json());
      } else {
        const res = await apiFetch('/api/users');
        const data = await res.json();
        setUsers(data.filter((u: any) => u.status === 'approved'));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const getStatus = (date: string, time: string) => {
    const d = parseISO(`${date}T${time}`);
    const now = new Date();
    if (d > now) return { label: 'À venir', color: 'bg-blue-500' };
    if (Math.abs(d.getTime() - now.getTime()) < 2 * 60 * 60 * 1000) return { label: 'En cours', color: 'bg-emerald-500' };
    return { label: 'Passée', color: 'bg-slate-400' };
  };

  const filteredUsers = users.filter(u => 
    (u.first_name + u.last_name + (u.district || '') + (u.region || '')).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Espace Membre</h2>
          <p className="text-emerald-600 font-bold text-xs uppercase tracking-[0.3em] mt-1">ADC Madagascar</p>
        </div>
        <div className="flex bg-white p-2 rounded-3xl shadow-xl border border-slate-100 w-full sm:w-auto overflow-x-auto">
          <button onClick={() => setActiveTab('meetings')} className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl text-[10px] sm:text-xs font-black transition-all ${activeTab === 'meetings' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>RÉUNIONS</button>
          <button onClick={() => setActiveTab('members')} className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl text-[10px] sm:text-xs font-black transition-all ${activeTab === 'members' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>MEMBRES</button>
          <Link to="/profile" className="flex-1 sm:flex-none px-6 py-3 rounded-2xl text-[10px] sm:text-xs font-black transition-all text-slate-400 hover:text-emerald-600 flex items-center justify-center gap-2"><User size={16}/> PROFIL</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard label="Total Membres" val={stats.totalMembers} color="emerald" icon={<Users/>} />
        <StatCard label="Réunions" val={stats.totalMeetings} color="blue" icon={<Calendar/>} />
        <StatCard label="% Présence" val={`${stats.averageAttendance}%`} color="purple" icon={<TrendingUp/>} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-emerald-500"/></div>
      ) : activeTab === 'meetings' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((m) => {
            const status = getStatus(m.date, m.time);
            return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={m.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col">
               <div className="flex justify-between items-start mb-6">
                 <h3 className="font-bold text-slate-800 text-xl line-clamp-2">{m.title}</h3>
                 <span className={`px-2 py-1 text-[10px] font-bold text-white rounded-md whitespace-nowrap ${status.color}`}>{status.label}</span>
               </div>
               <div className="flex gap-6 mb-8 text-xs font-bold text-slate-500 flex-1">
                  <div className="flex items-center gap-2"><Calendar size={18} className="text-emerald-500"/> {format(new Date(m.date), 'dd/MM/yyyy')}</div>
                  <div className="flex items-center gap-2"><Clock size={18} className="text-emerald-500"/> {m.time}</div>
               </div>
               <Link to={`/meetings/${m.id}`} className="block w-full text-center py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all uppercase tracking-widest">Voir les détails</Link>
            </motion.div>
          )})}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input type="text" placeholder="Chercher un collègue, un district, une région..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-white rounded-[2rem] shadow-sm border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((u) => (
              <motion.div whileHover={{ y: -5 }} key={u.id} onClick={() => setSelectedUser(u)} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 cursor-pointer hover:shadow-2xl transition-all group">
                {u.photo_url ? (
                  <img src={u.photo_url} className="w-16 h-16 rounded-[1.5rem] object-cover border-4 border-slate-50 shadow-md group-hover:scale-110 transition-transform" />
                ) : (
                  <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 flex items-center justify-center border-4 border-white shadow-md group-hover:scale-110 transition-transform p-3">
                    <img src="/logoADC.png" className="w-full h-full object-contain opacity-40 grayscale" alt="ADC" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-base truncate">{u.first_name} {u.last_name}</div>
                  <div className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1 truncate"><MapPin size={12}/> {u.district || u.region || 'Localisation N/A'}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS COMPLET */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 relative">
              <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 bg-slate-100 rounded-full"><X size={24} /></button>
              
              <div className="flex flex-col items-center mb-6">
                {selectedUser.photo_url ? (
                    <img src={selectedUser.photo_url} className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-md mb-4" />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center border-4 border-white shadow-md mb-4 p-4">
                        <img src="/logoADC.png" className="w-full h-full object-contain opacity-30" />
                    </div>
                )}
                <h2 className="text-2xl font-bold text-slate-800 text-center">{selectedUser.first_name} {selectedUser.last_name}</h2>
                <div className="mt-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-2">
                    <UserCheck size={14}/> Membre Actif
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl grid grid-cols-2 gap-4">
                <DetailBox label="Province" val={selectedUser.province} />
                <DetailBox label="Région" val={selectedUser.region} />
                <DetailBox label="District" val={selectedUser.district} />
                <DetailBox label="Commune" val={selectedUser.commune} />
                <DetailBox label="Fokontany" val={selectedUser.fokontany} />
                <DetailBox label="Téléphone" val={selectedUser.phone} />
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
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{val}</h2>
            </div>
        </div>
    );
}

function DetailBox({ label, val }: any) {
    return (
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-700 truncate">{val || '---'}</p>
        </div>
    );
}