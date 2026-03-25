import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Users, Calendar, Check, X, Plus, Trash2, Search, 
  TrendingUp, UserPlus, User, MapPin, Mail, Phone, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../lib/apiFetch';
import ConfirmModal from '../components/ConfirmModal';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'members' | 'meetings'>('members');
  const [users, setUsers] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalMembers: 0, pendingMembers: 0, totalMeetings: 0, averageAttendance: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // MODALS & STATES
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: 0, type: 'delete' as 'delete' | 'meeting', title: '', msg: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', description: '', date: '', time: '' });

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

  const handleUpdateStatus = async (id: number, status: string, e: any) => {
    e.stopPropagation();
    try {
      await apiFetch(`/api/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteClick = (id: number, type: 'delete' | 'meeting', e: any) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true, id, type,
      title: type === 'delete' ? 'Supprimer ce membre' : 'Supprimer la réunion',
      msg: type === 'delete' ? 'Cette action est irréversible.' : 'Toutes les données de présence seront perdues.'
    });
  };

  const executeDelete = async () => {
    setActionLoading(true);
    try {
      const url = confirmModal.type === 'delete' ? `/api/users/${confirmModal.id}` : `/api/meetings/${confirmModal.id}`;
      await apiFetch(url, { method: 'DELETE' });
      setConfirmModal({ ...confirmModal, isOpen: false });
      fetchData();
    } finally { setActionLoading(false); }
  };

  const handleCreateMeeting = async (e: any) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiFetch('/api/meetings', { method: 'POST', body: JSON.stringify(newMeeting) });
      setShowNewMeeting(false);
      setNewMeeting({ title: '', description: '', date: '', time: '' });
      fetchData();
    } finally { setActionLoading(false); }
  };

  const filteredUsers = users.filter(u => {
    const s = searchTerm.toLowerCase();
    return u.first_name.toLowerCase().includes(s) || u.last_name.toLowerCase().includes(s) || 
           u.district?.toLowerCase().includes(s) || u.region?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">ADC Admin</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 italic">Gestion Madagascar</p>
        </div>
        <div className="flex bg-slate-200/50 p-1.5 rounded-[1.2rem] border border-slate-200/50 w-full sm:w-auto">
          <button onClick={() => setActiveTab('members')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'members' ? 'bg-white text-emerald-600 shadow-xl' : 'text-slate-500'}`}>MEMBRES</button>
          <button onClick={() => setActiveTab('meetings')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'meetings' ? 'bg-white text-emerald-600 shadow-xl' : 'text-slate-500'}`}>RÉUNIONS</button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Membres" val={stats.totalMembers} icon={<Users/>} color="emerald" />
        <StatCard label="Attente" val={stats.pendingMembers} icon={<UserPlus/>} color="amber" />
        <StatCard label="Réunions" val={stats.totalMeetings} icon={<Calendar/>} color="blue" />
        <StatCard label="Présence" val={`${stats.averageAttendance}%`} icon={<TrendingUp/>} color="purple" />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full" />
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Synchronisation...</p>
        </div>
      ) : activeTab === 'members' ? (
        <div className="space-y-6">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input type="text" placeholder="Rechercher par nom, district, région..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] outline-none shadow-sm focus:border-emerald-500 transition-all font-medium text-slate-700 placeholder:text-slate-300" />
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="p-5 pl-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Membre</th>
                    <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Localisation</th>
                    <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} onClick={() => setSelectedUser(u)} className="hover:bg-slate-50/80 cursor-pointer group transition-all">
                      <td className="p-5 pl-8">
                        <div className="flex items-center gap-4">
                          <img src={u.photo_url} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{u.first_name} {u.last_name}</div>
                            <div className={`text-[10px] font-black uppercase mt-1 ${u.status === 'approved' ? 'text-emerald-500' : 'text-amber-500'}`}>{u.status}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="text-xs font-bold text-slate-700">{u.district || 'Non défini'}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 italic">{u.region} • {u.province}</div>
                      </td>
                      <td className="p-5 pr-8">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {u.status === 'pending' && <button onClick={(e) => handleUpdateStatus(u.id, 'approved', e)} className="p-2.5 text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><Check size={18}/></button>}
                          <button onClick={(e) => handleDeleteClick(u.id, 'delete', e)} className="p-2.5 text-red-500 bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* RÉUNIONS */
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => setShowNewMeeting(true)} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-200 hover:bg-emerald-700 flex items-center gap-2 transition-all active:scale-95">
                <Plus size={18}/> NOUVELLE RÉUNION
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {meetings.map((m) => (
               <div key={m.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all group relative">
                 <button onClick={() => handleDeleteClick(m.id, 'meeting', {stopPropagation:()=>{}})} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                 <h3 className="font-black text-slate-800 text-lg mb-4 line-clamp-1">{m.title}</h3>
                 <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 mb-6 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5"><Calendar size={14} className="text-emerald-500"/> {format(new Date(m.date), 'dd/MM/yy')}</div>
                    <div className="flex items-center gap-1.5"><Clock size={14} className="text-emerald-500"/> {m.time}</div>
                 </div>
                 <Link to={`/meetings/${m.id}`} className="block w-full text-center py-3 bg-slate-50 text-emerald-600 rounded-xl font-black text-xs hover:bg-emerald-600 hover:text-white transition-all">GÉRER LES PRÉSENCES</Link>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* MODAL NOUVELLE REUNION */}
      <AnimatePresence>
        {showNewMeeting && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl">
                    <h3 className="text-2xl font-black text-slate-800 mb-6 text-center">Planifier</h3>
                    <form onSubmit={handleCreateMeeting} className="space-y-4">
                        <input type="text" placeholder="Titre de la réunion" value={newMeeting.title} onChange={(e)=>setNewMeeting({...newMeeting, title: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" required />
                        <textarea placeholder="Ordre du jour..." value={newMeeting.description} onChange={(e)=>setNewMeeting({...newMeeting, description: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold h-32" />
                        <div className="grid grid-cols-2 gap-4">
                            <input type="date" value={newMeeting.date} onChange={(e)=>setNewMeeting({...newMeeting, date: e.target.value})} className="p-4 bg-slate-50 rounded-2xl font-bold" required />
                            <input type="time" value={newMeeting.time} onChange={(e)=>setNewMeeting({...newMeeting, time: e.target.value})} className="p-4 bg-slate-50 rounded-2xl font-bold" required />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setShowNewMeeting(false)} className="flex-1 p-4 bg-slate-100 rounded-2xl font-black text-xs text-slate-500">ANNULER</button>
                            <button type="submit" disabled={actionLoading} className="flex-1 p-4 bg-emerald-600 rounded-2xl font-black text-xs text-white shadow-lg shadow-emerald-200">{actionLoading ? 'EN COURS...' : 'ENREGISTRER'}</button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DÉTAILS MEMBRE (VUE ADMIN) */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg p-8 sm:p-10 relative overflow-hidden">
              <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 p-2.5 bg-slate-50 text-slate-400 hover:text-slate-800 rounded-full transition-all"><X size={24} /></button>
              
              <div className="flex flex-col items-center mb-10 text-center">
                <img src={selectedUser.photo_url} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-emerald-50 shadow-2xl mb-6" />
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{selectedUser.first_name} <br/> {selectedUser.last_name}</h2>
                <div className="mt-4 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">{selectedUser.role} • ADC ACTIF</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Contact</p>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><Phone size={14} className="text-emerald-500"/> {selectedUser.phone}</div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 truncate"><Mail size={14} className="text-emerald-500"/> {selectedUser.email || 'N/A'}</div>
                    </div>
                </div>
                <div className="bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Province</p>
                    <div className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-tighter"><MapPin size={16} className="text-emerald-500"/> {selectedUser.province}</div>
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
                  <h3 className="text-[10px] font-black text-white/40 uppercase mb-6 tracking-[0.3em] text-center italic">Détails Localisation</h3>
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <DetailItemAdmin label="Région" val={selectedUser.region} />
                    <DetailItemAdmin label="District" val={selectedUser.district} />
                    <DetailItemAdmin label="Commune" val={selectedUser.commune} />
                    <DetailItemAdmin label="Fokontany" val={selectedUser.fokontany} />
                  </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.msg}
        confirmText="OUI, SUPPRIMER"
        type="danger"
        loading={actionLoading}
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}

// COMPONENTS
const StatCard = ({ icon, label, val, color }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all flex items-center gap-5 group">
    <div className={`w-14 h-14 rounded-2xl bg-${color}-50 text-${color}-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>{icon}</div>
    <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{val}</h2>
    </div>
  </div>
);

const DetailItemAdmin = ({ label, val }: any) => (
  <div className="text-center sm:text-left">
    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-xs font-bold text-emerald-400 truncate tracking-tight">{val || '---'}</p>
  </div>
);