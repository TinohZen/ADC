import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Search, MapPin, X, User, Phone, Mail, TrendingUp } from 'lucide-react';
import { apiFetch } from '../lib/apiFetch';

export default function MemberDashboard() {
  const [activeTab, setActiveTab] = useState<'meetings' | 'members'>('meetings');
  const [meetings, setMeetings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalMembers: 0, totalMeetings: 0, averageAttendance: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const[selectedUser, setSelectedUser] = useState<any>(null);

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
    const meetingDate = parseISO(`${date}T${time}`);
    const now = new Date();
    const diff = now.getTime() - meetingDate.getTime();
    if (diff > 0 && diff < 2 * 60 * 60 * 1000) return { label: 'En cours', color: 'bg-emerald-500' };
    if (diff > 2 * 60 * 60 * 1000) return { label: 'Passée', color: 'bg-slate-400' };
    return { label: 'À venir', color: 'bg-blue-500' };
  };

  const filteredUsers = users.filter(u => {
    const s = searchTerm.toLowerCase();
    return u.first_name.toLowerCase().includes(s) || u.last_name.toLowerCase().includes(s) || u.district?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-8">
      {/* HEADER AVEC BOUTON PROFIL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Espace Membre</h2>
          <p className="text-slate-500 text-sm mt-1">Consultez les activités de l'association</p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/50 rounded-xl border border-slate-200/50 w-full sm:w-auto">
          <button onClick={() => setActiveTab('members')} className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${activeTab === 'members' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            <Users size={18} /> <span className="hidden sm:inline">Membres</span>
          </button>
          <button onClick={() => setActiveTab('meetings')} className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${activeTab === 'meetings' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            <Calendar size={18} /> <span className="hidden sm:inline">Réunions</span>
          </button>
          <Link to="/profile" className="flex-1 sm:flex-none px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-200/50">
            <User size={18} /> <span className="hidden sm:inline">Profil</span>
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Users size={24} /></div>
          <div><p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Membres</p><h2 className="text-2xl font-bold text-slate-800">{stats.totalMembers}</h2></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Calendar size={24} /></div>
          <div><p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Réunions</p><h2 className="text-2xl font-bold text-slate-800">{stats.totalMeetings}</h2></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><TrendingUp size={24} /></div>
          <div><p className="text-xs font-medium text-slate-500 uppercase tracking-wider">% Présence</p><h2 className="text-2xl font-bold text-slate-800">{stats.averageAttendance}%</h2></div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">
          <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3"></div>
          Chargement...
        </div>
      ) : activeTab === 'meetings' ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((m) => {
            const status = getMeetingStatus(m.date, m.time);
            return (
              <motion.div key={m.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-all hover:border-emerald-200 group">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-slate-800 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors">{m.title}</h3>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase text-white ${status.color}`}>{status.label}</span>
                </div>
                <p className="text-slate-500 text-sm mb-5 flex-1 line-clamp-3 leading-relaxed">{m.description || 'Aucune description fournie.'}</p>
                
                <div className="flex flex-col gap-2.5 mb-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 font-medium"><div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><Calendar size={14} /></div><span>{format(new Date(m.date), 'EEEE d MMMM yyyy', { locale: fr })}</span></div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 font-medium"><div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><Clock size={14} /></div><span>{m.time}</span></div>
                </div>
                <Link to={`/meetings/${m.id}`} className="w-full py-2.5 bg-slate-50 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl font-semibold text-center transition-colors text-sm border border-slate-100">Voir les détails</Link>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Rechercher par nom, district..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none shadow-sm focus:ring-2 focus:ring-emerald-500/20" />
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u) => (
              <div key={u.id} onClick={() => setSelectedUser(u)} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all hover:border-emerald-300">
                {u.photo_url ? (
                  <img src={u.photo_url} className="w-12 h-12 rounded-full object-cover border border-slate-100" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">{u.first_name[0]}{u.last_name[0]}</div>
                )}
                <div>
                  <div className="font-bold text-slate-800">{u.first_name} {u.last_name}</div>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin size={10} className="text-emerald-500" />
                    <span>{u.district || u.region || 'Localisation non renseignée'}</span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      )}

      {/* MODAL DÉTAILS MEMBRE (LECTURE SEULE) */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 relative">
              <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
              
              <div className="flex flex-col items-center mb-6 text-center">
                {selectedUser.photo_url ? (
                  <img src={selectedUser.photo_url} className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-md mb-4" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl font-bold border-4 border-white shadow-md mb-4">{selectedUser.first_name[0]}{selectedUser.last_name[0]}</div>
                )}
                <h2 className="text-xl font-bold text-slate-800">{selectedUser.first_name} {selectedUser.last_name}</h2>
                <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700">Membre ADC Actif</span>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                    <Phone size={16} className="text-emerald-500 mb-1" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Contact</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedUser.phone}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                    <Mail size={16} className="text-emerald-500 mb-1" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                    <p className="text-sm font-semibold text-slate-800 truncate w-full px-2">{selectedUser.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center justify-center gap-2 uppercase tracking-widest"><MapPin size={16} className="text-emerald-500" /> Localisation</h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-center">
                    <DetailItem label="Province" val={selectedUser.province} />
                    <DetailItem label="Région" val={selectedUser.region} />
                    <DetailItem label="District" val={selectedUser.district} />
                    <DetailItem label="Commune" val={selectedUser.commune} />
                    <div className="col-span-2 pt-2 border-t border-slate-200/60"><DetailItem label="Fokontany" val={selectedUser.fokontany} /></div>
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

const DetailItem = ({ label, val }: any) => (
  <div>
    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">{label}</p>
    <p className="text-sm font-semibold text-slate-700">{val || <span className="text-slate-300 italic">Non renseigné</span>}</p>
  </div>
);