import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Search, MapPin, X, Phone, Mail, TrendingUp, Loader2 } from 'lucide-react';
import { apiFetch } from '../lib/apiFetch';

export default function MemberDashboard() {
  const [activeTab, setActiveTab] = useState<'meetings' | 'members'>('meetings');
  const [meetings, setMeetings] = useState<any[]>([]);
  const[users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalMembers: 0, totalMeetings: 0, averageAttendance: 0 });
  const[loading, setLoading] = useState(true);
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

  const getMeetingStatus = (date: string, time: string) => {
    const diff = new Date().getTime() - parseISO(`${date}T${time}`).getTime();
    if (diff > 0 && diff < 2 * 60 * 60 * 1000) return { label: 'En cours', color: 'bg-emerald-500' };
    if (diff > 2 * 60 * 60 * 1000) return { label: 'Passée', color: 'bg-slate-400' };
    return { label: 'À venir', color: 'bg-blue-500' };
  };

  const filteredUsers = users.filter(u => {
    const s = searchTerm.toLowerCase();
    return u.first_name.toLowerCase().includes(s) || u.last_name.toLowerCase().includes(s) || u.district?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Espace Membre</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 italic">ADC Madagascar</p>
        </div>
        <div className="flex bg-slate-200/50 p-1.5 rounded-[1.2rem] border border-slate-200/50 w-full sm:w-auto">
          <button onClick={() => setActiveTab('meetings')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'meetings' ? 'bg-white text-emerald-600 shadow-xl' : 'text-slate-500'}`}>RÉUNIONS</button>
          <button onClick={() => setActiveTab('members')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'members' ? 'bg-white text-emerald-600 shadow-xl' : 'text-slate-500'}`}>MEMBRES</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-emerald-500"/></div>
      ) : activeTab === 'meetings' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((m) => (
            <div key={m.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
               <h3 className="font-black text-slate-800 text-lg mb-4 line-clamp-1">{m.title}</h3>
               <div className="flex gap-4 text-[10px] font-black text-slate-400 mb-6 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5"><Calendar size={14} className="text-emerald-500"/> {format(new Date(m.date), 'dd/MM/yy')}</div>
                  <div className="flex items-center gap-1.5"><Clock size={14} className="text-emerald-500"/> {m.time}</div>
               </div>
               <Link to={`/meetings/${m.id}`} className="block text-center py-3 bg-slate-50 text-emerald-600 rounded-xl font-black text-xs hover:bg-emerald-600 hover:text-white transition-all">VOIR LES DÉTAILS</Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input type="text" placeholder="Chercher un collègue, un district..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] outline-none shadow-sm focus:border-emerald-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u) => (
              <div key={u.id} onClick={() => setSelectedUser(u)} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all">
                <img src={u.photo_url || '/placeholder.png'} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <div className="font-bold text-slate-800 text-sm">{u.first_name} {u.last_name}</div>
                  <div className="text-[9px] text-emerald-600 font-bold uppercase flex items-center gap-1"><MapPin size={10}/> {u.district || u.region}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL LECTURE SEULE */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md p-8 relative">
              <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X size={24} /></button>
              <div className="flex flex-col items-center mb-8 text-center">
                <img src={selectedUser.photo_url || '/placeholder.png'} className="w-24 h-24 rounded-[2rem] object-cover border-4 border-emerald-50 mb-4 shadow-lg" />
                <h2 className="text-xl font-black text-slate-800">{selectedUser.first_name} <br/>{selectedUser.last_name}</h2>
                <span className="mt-3 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase">MEMBRE ACTIF</span>
              </div>
              <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4">
                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact</p><p className="font-bold text-sm text-slate-700">{selectedUser.phone}</p></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Localisation</p><p className="font-bold text-sm text-emerald-600">{selectedUser.region} • {selectedUser.province}</p></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}