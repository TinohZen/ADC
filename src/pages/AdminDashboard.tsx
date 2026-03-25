import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Users, Calendar, Check, X, Plus, Trash2, Search, 
  TrendingUp, UserPlus, User, MapPin, Mail, Phone, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../lib/apiFetch';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'members' | 'meetings'>('members');
  const [users, setUsers] = useState<any[]>([]);
  const[meetings, setMeetings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalMembers: 0, pendingMembers: 0, totalMeetings: 0, averageAttendance: 0 });
  const [loading, setLoading] = useState(true);
  const[searchTerm, setSearchTerm] = useState('');
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const[newMeeting, setNewMeeting] = useState({ title: '', description: '', date: '', time: '' });

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await apiFetch('/api/stats');
      setStats(await statsRes.json());
      if (activeTab === 'members') {
        const res = await apiFetch('/api/users');
        setUsers(await res.json());
      } else {
        const res = await apiFetch('/api/meetings');
        setMeetings(await res.json());
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleUpdateStatus = async (id: number, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiFetch(`/api/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteUser = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) return;
    try {
      await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/meetings', { method: 'POST', body: JSON.stringify(newMeeting) });
      setShowNewMeeting(false);
      setNewMeeting({ title: '', description: '', date: '', time: '' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteMeeting = async (id: number) => {
    if (!confirm('Supprimer cette réunion ?')) return;
    try {
      await apiFetch(`/api/meetings/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const getMeetingStatus = (date: string, time: string) => {
    const meetingDate = parseISO(`${date}T${time}`);
    const now = new Date();
    const diff = now.getTime() - meetingDate.getTime();
    const twoHours = 2 * 60 * 60 * 1000;
    if (diff > 0 && diff < twoHours) return { label: 'En cours', color: 'bg-emerald-500' };
    if (diff > twoHours) return { label: 'Passée', color: 'bg-slate-400' };
    return { label: 'À venir', color: 'bg-blue-500' };
  };

  const filteredUsers = users.filter(u => {
    const s = searchTerm.toLowerCase();
    return u.first_name.toLowerCase().includes(s) || u.last_name.toLowerCase().includes(s) || 
           u.phone.includes(s) || u.district?.toLowerCase().includes(s) || u.region?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-8">
      {/* HEADER AMÉLIORÉ AVEC BOUTON PROFIL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Tableau de bord</h2>
          <p className="text-slate-500 text-sm mt-1">Gérez les membres et les réunions</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Membres" val={stats.totalMembers} icon={<Users/>} color="emerald" />
        <StatCard label="En attente" val={stats.pendingMembers} icon={<UserPlus/>} color="amber" />
        <StatCard label="Réunions" val={stats.totalMeetings} icon={<Calendar/>} color="blue" />
        <StatCard label="% Présence" val={`${stats.averageAttendance}%`} icon={<TrendingUp/>} color="purple" />
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">
          <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3"></div>
          Chargement des données...
        </div>
      ) : activeTab === 'members' ? (
        <div className="space-y-4">
          {/* RECHERCHE */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Rechercher par nom, téléphone, région ou district..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none shadow-sm focus:ring-2 focus:ring-emerald-500/20 transition-all" />
          </div>

          {/* TABLEAU DES MEMBRES */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="p-4 pl-6">Membre</th>
                    <th className="p-4">Localisation</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence>
                    {filteredUsers.map((u) => (
                      <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUser(u)} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            {u.photo_url ? (
                              <img src={u.photo_url} className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">{u.first_name[0]}{u.last_name[0]}</div>
                            )}
                            <div>
                              <div className="font-semibold text-slate-800">{u.first_name} {u.last_name}</div>
                              <div className="text-xs text-slate-500">{u.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-medium text-slate-700">{u.district || u.region || 'Non renseigné'}</div>
                          {u.province && (
                            <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">
                              {u.region && u.district ? `${u.region} • ` : ''}{u.province}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                            {u.status === 'approved' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50">Approuvé</span>
                            ) : u.status === 'pending' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/50">En attente</span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200/50">Refusé</span>
                            )}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {u.status === 'pending' && (
                              <>
                                <button onClick={(e) => handleUpdateStatus(u.id, 'approved', e)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Check size={18}/></button>
                                <button onClick={(e) => handleUpdateStatus(u.id, 'rejected', e)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><X size={18}/></button>
                              </>
                            )}
                            <button onClick={(e) => handleDeleteUser(u.id, e)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"><Trash2 size={18}/></button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={4} className="p-12 text-center text-slate-500"><Search size={40} className="text-slate-300 mx-auto mb-3" /><p>Aucun membre trouvé.</p></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      ) : (
        /* SECTION RÉUNIONS (Design original) */
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => setShowNewMeeting(!showNewMeeting)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-sm shadow-emerald-600/20">
              <Plus size={18} /> Nouvelle réunion
            </button>
          </div>

          <AnimatePresence>
            {showNewMeeting && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 mb-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-5">Planifier une réunion</h3>
                  <form onSubmit={handleCreateMeeting} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Titre</label>
                      <input type="text" value={newMeeting.title} onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                      <textarea value={newMeeting.description} onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none" rows={3} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label><input type="date" value={newMeeting.date} onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" required /></div>
                      <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Heure</label><input type="time" value={newMeeting.time} onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" required /></div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button type="button" onClick={() => setShowNewMeeting(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Annuler</button>
                      <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-sm shadow-emerald-600/20">Enregistrer</button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetings.map((meeting) => {
              const status = getMeetingStatus(meeting.date, meeting.time);
              return (
                <motion.div key={meeting.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col group hover:shadow-md transition-all hover:border-emerald-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-800 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors">{meeting.title}</h3>
                      <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase text-white mt-1 ${status.color}`}>{status.label}</span>
                    </div>
                    <button onClick={() => handleDeleteMeeting(meeting.id)} className="text-slate-300 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 -mr-2 -mt-2 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                  </div>
                  <p className="text-slate-500 text-sm mb-5 flex-1 line-clamp-3 leading-relaxed">{meeting.description || 'Aucune description.'}</p>
                  <div className="flex flex-col gap-2.5 mb-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2.5 text-sm text-slate-600 font-medium"><div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><Calendar size={14} /></div><span>{format(new Date(meeting.date), 'dd MMMM yyyy', { locale: fr })}</span></div>
                    <div className="flex items-center gap-2.5 text-sm text-slate-600 font-medium"><div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><Clock size={14} /></div><span>{meeting.time}</span></div>
                  </div>
                  <Link to={`/meetings/${meeting.id}`} className="w-full py-2.5 bg-slate-50 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl font-semibold text-center transition-colors text-sm border border-slate-100">Gérer les présences</Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* MODAL DÉTAILS DU MEMBRE (MAGNIFIQUE) */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
              
              <div className="p-6 sm:p-8">
                {/* Header Profil */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-5">
                    {selectedUser.photo_url ? (
                       <img src={selectedUser.photo_url} className="w-20 h-20 rounded-2xl object-cover border-4 border-slate-50 shadow-sm" />
                    ) : (
                       <div className="w-20 h-20 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-bold border-4 border-white shadow-sm">{selectedUser.first_name[0]}{selectedUser.last_name[0]}</div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 leading-tight">{selectedUser.first_name} <br/> {selectedUser.last_name}</h2>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mt-2 ${selectedUser.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {selectedUser.role} • {selectedUser.status === 'approved' ? 'Actif' : 'En attente'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors bg-slate-50"><X size={20} /></button>
                </div>

                {/* Contacts */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm"><Phone size={14}/></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase">Téléphone</p><p className="text-sm font-semibold text-slate-800">{selectedUser.phone}</p></div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm"><Mail size={14}/></div>
                    <div className="min-w-0"><p className="text-[10px] font-bold text-slate-400 uppercase">Email</p><p className="text-sm font-semibold text-slate-800 truncate">{selectedUser.email || 'N/A'}</p></div>
                  </div>
                </div>

                {/* Adresse Complète */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-widest"><MapPin size={16} className="text-emerald-500" /> Localisation</h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
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

// Composants Utilitaires (Garde le beau design)
const StatCard = ({ icon, label, val, color }: any) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl bg-${color}-50 text-${color}-600 flex items-center justify-center`}>{icon}</div>
    <div><p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p><h2 className="text-2xl font-bold text-slate-800">{val}</h2></div>
  </div>
);

const DetailItem = ({ label, val }: any) => (
  <div>
    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">{label}</p>
    <p className="text-sm font-semibold text-slate-700">{val || <span className="text-slate-300 italic">Non renseigné</span>}</p>
  </div>
);