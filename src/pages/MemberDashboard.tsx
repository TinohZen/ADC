import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Search, MapPin, X, User } from 'lucide-react';
import { apiFetch } from '../lib/apiFetch';

export default function MemberDashboard() {
  const [activeTab, setActiveTab] = useState<'meetings' | 'members'>('meetings');
  const [meetings, setMeetings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
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

  const filteredUsers = users.filter(u => {
    const s = searchTerm.toLowerCase();
    return u.first_name.toLowerCase().includes(s) || u.last_name.toLowerCase().includes(s) || u.district?.toLowerCase().includes(s);
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
               <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                 <div className="flex items-center gap-1"><Calendar size={14}/> {format(new Date(m.date), 'dd/MM/yy')}</div>
                 <div className="flex items-center gap-1"><Clock size={14}/> {m.time}</div>
               </div>
               <Link to={`/meetings/${m.id}`} className="mt-4 block text-center py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold">Voir les détails</Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input type="text" placeholder="Chercher un membre, un district..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 p-3 bg-white border border-slate-200 rounded-2xl outline-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u) => (
              <div key={u.id} onClick={() => setSelectedUser(u)} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all">
                <img src={u.photo_url} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <div className="font-bold text-slate-800 text-sm">{u.first_name} {u.last_name}</div>
                  <div className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 uppercase"><MapPin size={10}/> {u.district}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 relative">
              <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 p-2 text-slate-400"><X size={24}/></button>
              <div className="flex flex-col items-center mb-6">
                <img src={selectedUser.photo_url} className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 mb-4" />
                <h2 className="text-xl font-bold">{selectedUser.first_name} {selectedUser.last_name}</h2>
                <p className="text-emerald-500 font-bold text-[10px] uppercase">Membre ADC Actif</p>
              </div>
              <div className="space-y-4 border-t pt-6">
                <div className="grid grid-cols-2 gap-4">
                    <InfoBox label="Province" val={selectedUser.province} />
                    <InfoBox label="Région" val={selectedUser.region} />
                    <InfoBox label="District" val={selectedUser.district} />
                    <InfoBox label="Commune" val={selectedUser.commune} />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[9px] font-bold text-slate-400 uppercase">Fokontany</p><p className="text-sm font-bold">{selectedUser.fokontany}</p></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const InfoBox = ({ label, val }: any) => (
  <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[9px] font-bold text-slate-400 uppercase">{label}</p><p className="text-xs font-bold text-slate-700">{val}</p></div>
);