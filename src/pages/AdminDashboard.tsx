import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Calendar, Check, X, Plus, Trash2, Search, TrendingUp, UserPlus, MapPin, Mail, Phone, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../lib/apiFetch';
import ConfirmModal from '../components/ConfirmModal';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'members' | 'meetings'>('members');
  const [users, setUsers] = useState<any[]>([]);
  const[meetings, setMeetings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalMembers: 0, pendingMembers: 0, totalMeetings: 0, averageAttendance: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // POPUPS D'ACTION
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: 0, type: 'user' as 'user'|'meeting' });
  const [statusPopup, setStatusPopup] = useState({ isOpen: false, title: '', msg: '', type: 'success' as any });
  const[actionLoading, setActionLoading] = useState(false);

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
      setStatusPopup({ isOpen: true, title: 'Fait !', msg: `Le statut du membre a été mis à jour.`, type: 'success' });
      fetchData();
    } catch { setStatusPopup({ isOpen: true, title: 'Erreur', msg: 'Impossible de changer le statut.', type: 'danger' }); }
  };

  const executeDelete = async () => {
    setActionLoading(true);
    try {
        const url = confirmDelete.type === 'user' ? `/api/users/${confirmDelete.id}` : `/api/meetings/${confirmDelete.id}`;
        await apiFetch(url, { method: 'DELETE' });
        setConfirmDelete({ ...confirmDelete, isOpen: false });
        setStatusPopup({ isOpen: true, title: 'Supprimé !', msg: 'La suppression est confirmée.', type: 'success' });
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
      setStatusPopup({ isOpen: true, title: 'Réunion Créée', msg: 'La réunion est prête !', type: 'success' });
      fetchData();
    } finally { setActionLoading(false); }
  };

  const filteredUsers = users.filter(u => {
    const s = searchTerm.toLowerCase();
    return u.first_name.toLowerCase().includes(s) || u.last_name.toLowerCase().includes(s) || u.district?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-8 pb-20">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Membres" val={stats.totalMembers} icon={<Users/>} color="emerald" />
        <StatCard label="Attente" val={stats.pendingMembers} icon={<UserPlus/>} color="amber" />
        <StatCard label="Réunions" val={stats.totalMeetings} icon={<Calendar/>} color="blue" />
        <StatCard label="Présence" val={`${stats.averageAttendance}%`} icon={<TrendingUp/>} color="purple" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-emerald-500"/></div>
      ) : activeTab === 'members' ? (
        <div className="space-y-6">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] outline-none shadow-sm focus:border-emerald-500 transition-all font-medium text-slate-700" />
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
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
                        <img src={u.photo_url || '/placeholder.png'} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{u.first_name} {u.last_name}</div>
                          <div className={`text-[10px] font-black uppercase mt-1 ${u.status === 'approved' ? 'text-emerald-500' : 'text-amber-500'}`}>{u.status}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="text-xs font-bold text-slate-700">{u.district || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 italic">{u.region} • {u.province}</div>
                    </td>
                    <td className="p-5 pr-8 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                        {u.status === 'pending' && <button onClick={(e) => handleUpdateStatus(u.id, 'approved', e)} className="p-2.5 text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><Check size={18}/></button>}
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete({ isOpen: true, id: u.id, type: 'user' })}} className="p-2.5 text-red-500 bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end"><button onClick={() => setShowNewMeeting(true)} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-200 hover:bg-emerald-700 flex items-center gap-2"><Plus size={18}/> NOUVELLE RÉUNION</button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {meetings.map((m) => (
               <div key={m.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative">
                 <button onClick={() => setConfirmDelete({ isOpen: true, id: m.id, type: 'meeting' })} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                 <h3 className="font-black text-slate-800 text-lg mb-4 line-clamp-1">{m.title}</h3>
                 <div className="flex gap-4 text-[10px] font-black text-slate-400 mb-6 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5"><Calendar size={14} className="text-emerald-500"/> {format(new Date(m.date), 'dd/MM/yy')}</div>
                    <div className="flex items-center gap-1.5"><Clock size={14} className="text-emerald-500"/> {m.time}</div>
                 </div>
                 <Link to={`/meetings/${m.id}`} className="block text-center py-3 bg-slate-50 text-emerald-600 rounded-xl font-black text-xs hover:bg-emerald-600 hover:text-white transition-all">PRÉSENCES</Link>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* MODAL NOUVELLE REUNION */}
      <AnimatePresence>
        {showNewMeeting && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl">
                    <h3 className="text-2xl font-black text-slate-800 mb-6 text-center">Planifier</h3>
                    <form onSubmit={handleCreateMeeting} className="space-y-4">
                        <input type="text" placeholder="Titre" value={newMeeting.title} onChange={(e)=>setNewMeeting({...newMeeting, title: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none" required />
                        <textarea placeholder="Ordre du jour..." value={newMeeting.description} onChange={(e)=>setNewMeeting({...newMeeting, description: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold h-32 outline-none" />
                        <div className="grid grid-cols-2 gap-4">
                            <input type="date" value={newMeeting.date} onChange={(e)=>setNewMeeting({...newMeeting, date: e.target.value})} className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" required />
                            <input type="time" value={newMeeting.time} onChange={(e)=>setNewMeeting({...newMeeting, time: e.target.value})} className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" required />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setShowNewMeeting(false)} className="flex-1 p-4 bg-slate-100 rounded-2xl font-black text-xs text-slate-500">ANNULER</button>
                            <button type="submit" disabled={actionLoading} className="flex-1 p-4 bg-emerald-600 rounded-2xl font-black text-xs text-white shadow-lg flex justify-center gap-2">
                                {actionLoading && <Loader2 size={16} className="animate-spin"/>} ENREGISTRER
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* POPUPS */}
      <ConfirmModal isOpen={confirmDelete.isOpen} title={confirmDelete.type === 'user' ? 'Supprimer membre ?' : 'Supprimer réunion ?'} message="Cette action est définitive et irréversible." confirmText="OUI, SUPPRIMER" type="danger" loading={actionLoading} onConfirm={executeDelete} onCancel={() => setConfirmDelete({ ...confirmDelete, isOpen: false })} />
      <ConfirmModal isOpen={statusPopup.isOpen} title={statusPopup.title} message={statusPopup.msg} type={statusPopup.type} onlyConfirm onCancel={() => setStatusPopup({ ...statusPopup, isOpen: false })} />
    </div>
  );
}

const StatCard = ({ icon, label, val, color }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
    <div className={`w-14 h-14 rounded-2xl bg-${color}-50 text-${color}-600 flex items-center justify-center`}>{icon}</div>
    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p><h2 className="text-2xl font-black text-slate-800">{val}</h2></div>
  </div>
);