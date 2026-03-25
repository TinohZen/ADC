import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, Search, TrendingUp, UserCheck, MapPin, User, X, Mail, Phone } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../lib/apiFetch';

export default function MemberDashboard() {
  const [activeTab, setActiveTab] = useState<'meetings' | 'members'>('meetings');
  const [meetings, setMeetings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalMembers: 0, totalMeetings: 0, averageAttendance: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

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

  const filteredUsers = users.filter(user => {
    const s = searchTerm.toLowerCase();
    return user.first_name.toLowerCase().includes(s) || user.last_name.toLowerCase().includes(s) || user.region?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Espace Membre</h2>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setActiveTab('meetings')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'meetings' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}>Réunions</button>
          <button onClick={() => setActiveTab('members')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'members' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}>Membres</button>
        </div>
      </div>

      {activeTab === 'meetings' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {meetings.map((m) => (
            <div key={m.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <h3 className="font-bold text-lg mb-2">{m.title}</h3>
               <p className="text-slate-500 text-sm mb-4 line-clamp-2">{m.description}</p>
               <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                 <div className="flex items-center gap-1"><Calendar size={14}/> {format(new Date(m.date), 'dd/MM/yy')}</div>
                 <div className="flex items-center gap-1"><Clock size={14}/> {m.time}</div>
               </div>
               <Link to={`/meetings/${m.id}`} className="mt-4 block text-center py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold">Détails</Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input type="text" placeholder="Chercher un membre ou une ville..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 p-3 bg-white border border-slate-200 rounded-2xl outline-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u) => (
              <div key={u.id} onClick={() => setSelectedUser(u)} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all">
                <img src={u.photo_url} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <div className="font-bold text-slate-800">{u.first_name} {u.last_name}</div>
                  <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><MapPin size={10}/> {u.district}, {u.region}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS (Même que Admin mais lecture seule) */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 relative">
              <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 p-2 text-slate-400"><X size={24}/></button>
              
              <div className="flex items-center gap-5 mb-8">
                <img src={selectedUser.photo_url} className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
                <div>
                  <h2 className="text-xl font-bold">{selectedUser.first_name} {selectedUser.last_name}</h2>
                  <p className="text-emerald-500 font-bold text-xs uppercase italic">Membre ADC Actif</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-2xl"><p className="text-[10px] font-bold text-slate-400 uppercase">Contact</p><p className="text-sm font-bold">{selectedUser.phone}</p></div>
                    <div className="bg-slate-50 p-3 rounded-2xl"><p className="text-[10px] font-bold text-slate-400 uppercase">Province</p><p className="text-sm font-bold">{selectedUser.province}</p></div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-xs font-bold mb-4 flex items-center gap-2"><MapPin size={14} className="text-emerald-500"/> LOCALISATION</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase">Région</p><p className="text-sm font-semibold">{selectedUser.region}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase">District</p><p className="text-sm font-semibold">{selectedUser.district}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase">Commune</p><p className="text-sm font-semibold">{selectedUser.commune}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase">Fokontany</p><p className="text-sm font-semibold">{selectedUser.fokontany}</p></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}