import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Calendar, Check, X, Plus, Trash2, Search, TrendingUp, UserPlus, MapPin, Mail, Phone, Clock, Loader2, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../lib/apiFetch';
import ConfirmModal from '../components/ConfirmModal';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'members' | 'meetings'>('members');
  const [users, setUsers] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const[stats, setStats] = useState<any>({ totalMembers: 0, pendingMembers: 0, totalMeetings: 0, averageAttendance: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: 0, type: 'user' as any });
  const [popup, setPopup] = useState({ isOpen: false, title: '', msg: '', type: 'success' as any });
  const[actionLoading, setActionLoading] = useState(false);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', description: '', date: '', time: '' });

  // GESTION DES RÔLES ET TITRES DYNAMIQUES
  const userStr = localStorage.getItem('adc_user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = currentUser?.role === 'admin';
  const dashboardTitle = currentUser?.role === 'chef' ? 'ADC Chef' : 'ADC Admin';

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const s = await (await apiFetch('/api/stats')).json();
      setStats(s);
      if (activeTab === 'members') setUsers(await (await apiFetch('/api/users')).json());
      else setMeetings(await (await apiFetch('/api/meetings')).json());
    } finally { setLoading(false); }
  };

  const getStatus = (date: string, time: string) => {
    const d = parseISO(`${date}T${time}`);
    const now = new Date();
    if (d > now) return { label: 'À venir', color: 'bg-blue-500' };
    if (Math.abs(d.getTime() - now.getTime()) < 2 * 60 * 60 * 1000) return { label: 'En cours', color: 'bg-emerald-500' };
    return { label: 'Passée', color: 'bg-slate-400' };
  };

  const handleStatus = async (id: number, status: string, e: any) => {
    e.stopPropagation();
    await apiFetch(`/api/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    setPopup({ isOpen: true, title: 'Mis à jour', msg: 'Le statut a été modifié.', type: 'success' });
    fetchData();
  };

  const executeDelete = async () => {
    setActionLoading(true);
    try {
        const url = confirmDelete.type === 'user' ? `/api/users/${confirmDelete.id}` : `/api/meetings/${confirmDelete.id}`;
        await apiFetch(url, { method: 'DELETE' });
        setConfirmDelete({ ...confirmDelete, isOpen: false });
        setPopup({ isOpen: true, title: 'Supprimé', msg: 'Élément retiré avec succès.', type: 'success' });
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
      setPopup({ isOpen: true, title: 'Créée', msg: 'La nouvelle réunion est enregistrée.', type: 'success' });
      fetchData();
    } finally { setActionLoading(false); }
  };

  const filteredUsers = users.filter(u => 
    (u.first_name + u.last_name + (u.district || '')).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">{dashboardTitle}</h2>
          <p className="text-emerald-600 font-bold text-xs uppercase tracking-[0.3em] mt-1">Gestion Nationale</p>
        </div>
        <div className="flex bg-white p-2 rounded-3xl shadow-xl border border-slate-100">
          <button onClick={() => setActiveTab('members')} className={`px-8 py-3 rounded-2xl text-xs font-black transition-all ${activeTab === 'members' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-700'}`}>Membres</button>
          <button onClick={() => setActiveTab('meetings')} className={`px-8 py-3 rounded-2xl text-xs font-black transition-all ${activeTab === 'meetings' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-700'}`}>Réunions</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Membres" val={stats.totalMembers} color="emerald" icon={<Users/>} />
        <StatCard label="En Attente" val={stats.pendingMembers} color="amber" icon={<UserPlus/>} />
        <StatCard label="Réunions" val={stats.totalMeetings} color="blue" icon={<Calendar/>} />
        <StatCard label="Présence" val={`${stats.averageAttendance}%`} color="purple" icon={<TrendingUp/>} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-emerald-500"/></div>
      ) : activeTab === 'members' ? (
        <div className="space-y-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input type="text" placeholder="Rechercher un membre..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-white rounded-[2rem] shadow-sm border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(u => (
              <motion.div whileHover={{ y: -5 }} onClick={() => setSelectedUser(u)} key={u.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 cursor-pointer hover:shadow-2xl transition-all group flex items-center gap-5">
                {u.photo_url ? (
                    <img src={u.photo_url} className="w-16 h-16 rounded-[1.5rem] object-cover border-4 border-slate-50 shadow-md group-hover:scale-110 transition-transform" />
                ) : (
                    <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 flex items-center justify-center border-4 border-white shadow-md p-3 group-hover:scale-110 transition-transform">
                        <img src="/logoADC.png" className="w-full h-full object-contain opacity-40 grayscale" alt="ADC" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm leading-tight truncate uppercase">{u.first_name} {u.last_name}</h3>
                  <div className={`text-[10px] font-bold uppercase mt-1 flex items-center gap-1 ${u.status === 'approved' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {u.status === 'approved' ? 'Approuvé' : 'En attente'}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {u.status === 'pending' && <button onClick={(e)=>handleStatus(u.id, 'approved', e)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Check size={16}/></button>}
                  {/* SEUL L'ADMIN PEUT SUPPRIMER */}
                  {isSuperAdmin && (
                    <button onClick={(e)=>{e.stopPropagation(); setConfirmDelete({isOpen:true, id:u.id, type:'user'})}} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
           <div className="flex justify-end"><button onClick={()=>setShowNewMeeting(true)} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2 uppercase tracking-widest"><Plus size={20}/> Nouvelle réunion</button></div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meetings.map(m => { 
                const s = getStatus(m.date, m.time);
                return (
                <div key={m.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative group hover:shadow-xl transition-all flex flex-col">
                    {/* SEUL L'ADMIN PEUT SUPPRIMER */}
                    {isSuperAdmin && (
                        <button onClick={() => setConfirmDelete({isOpen:true, id:m.id, type:'meeting'})} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>
                    )}
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xl font-bold text-slate-800 line-clamp-2 pr-8">{m.title}</h3>
                        <span className={`px-2 py-1 text-[10px] font-bold text-white rounded-md whitespace-nowrap mt-1 ${s.color}`}>{s.label}</span>
                    </div>
                    <div className="flex gap-4 mb-8 text-[10px] font-black text-slate-400 tracking-widest uppercase flex-1">
                        <div className="flex items-center gap-1.5"><Calendar size={14} className="text-emerald-500"/> {format(new Date(m.date), 'dd/MM/yyyy')}</div>
                        <div className="flex items-center gap-1.5"><Clock size={14} className="text-emerald-500"/> {m.time}</div>
                    </div>
                    <Link to={`/meetings/${m.id}`} className="block w-full text-center py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs hover:bg-emerald-600 transition-all uppercase tracking-widest">Gérer les présences</Link>
                </div>
              )})}
           </div>
        </div>
      )}

      {/* MODAL CRÉATION RÉUNION */}
      <AnimatePresence>
        {showNewMeeting && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl">
                    <h3 className="text-2xl font-black text-slate-800 mb-6 text-center">Nouvelle Réunion</h3>
                    <form onSubmit={handleCreateMeeting} className="space-y-4">
                        <input type="text" placeholder="Titre" value={newMeeting.title} onChange={(e)=>setNewMeeting({...newMeeting, title: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none" required />
                        <textarea placeholder="Description (optionnel)" value={newMeeting.description} onChange={(e)=>setNewMeeting({...newMeeting, description: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold h-32 outline-none" />
                        <div className="grid grid-cols-2 gap-4">
                            <input type="date" value={newMeeting.date} onChange={(e)=>setNewMeeting({...newMeeting, date: e.target.value})} className="p-4 bg-slate-50 rounded-2xl font-bold outline-none text-slate-600" required />
                            <input type="time" value={newMeeting.time} onChange={(e)=>setNewMeeting({...newMeeting, time: e.target.value})} className="p-4 bg-slate-50 rounded-2xl font-bold outline-none text-slate-600" required />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setShowNewMeeting(false)} className="flex-1 p-4 bg-slate-100 rounded-2xl font-bold text-xs text-slate-500 uppercase">Annuler</button>
                            <button type="submit" disabled={actionLoading} className="flex-1 p-4 bg-emerald-600 rounded-2xl font-bold text-xs text-white shadow-lg flex justify-center gap-2 uppercase">
                                {actionLoading && <Loader2 size={16} className="animate-spin"/>} Enregistrer
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DÉTAILS MEMBRE */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg p-10 relative overflow-hidden">
              <button onClick={() => setSelectedUser(null)} className="absolute top-8 right-8 p-3 bg-slate-50 text-slate-400 hover:text-slate-800 rounded-full transition-all"><X size={24} /></button>
              
              <div className="flex flex-col items-center mb-10 text-center">
                {selectedUser.photo_url ? (
                    <img src={selectedUser.photo_url} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-emerald-50 shadow-2xl mb-6" />
                ) : (
                    <div className="w-32 h-32 rounded-[2.5rem] bg-emerald-50 flex items-center justify-center border-4 border-white shadow-2xl mb-6 p-6">
                        <img src="/logoADC.png" className="w-full h-full object-contain opacity-30 grayscale" />
                    </div>
                )}
                <h2 className="text-2xl font-bold text-slate-800 leading-tight uppercase">{selectedUser.first_name} <br/> {selectedUser.last_name}</h2>
                <div className="mt-4 px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase flex items-center gap-2">
                    <UserCheck size={14}/> {selectedUser.status === 'approved' ? 'Membre Actif' : 'En attente'}
                </div>
              </div>

              <div className="bg-slate-50 p-8 rounded-[2.5rem] grid grid-cols-2 gap-6">
                <DetailBox label="Province" val={selectedUser.province} />
                <DetailBox label="Région" val={selectedUser.region} />
                <DetailBox label="District" val={selectedUser.district} />
                <DetailBox label="Commune" val={selectedUser.commune} />
                <div className="col-span-2 pt-4 border-t border-slate-200">
                   <div className="grid grid-cols-2 gap-6">
                       <DetailBox label="Téléphone" val={selectedUser.phone} />
                       <DetailBox label="Email" val={selectedUser.email} />
                   </div>
                </div>
                <div className="col-span-2 pt-4 border-t border-slate-200">
                    <DetailBox label="Fokontany" val={selectedUser.fokontany} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal isOpen={confirmDelete.isOpen} title="Supprimer ?" message="Cette action est irréversible. Voulez-vous continuer ?" confirmText="Oui, supprimer" type="danger" loading={actionLoading} onConfirm={executeDelete} onCancel={() => setConfirmDelete({ ...confirmDelete, isOpen: false })} />
      <ConfirmModal isOpen={popup.isOpen} title={popup.title} message={popup.msg} type={popup.type} onlyConfirm onCancel={() => setPopup({ ...popup, isOpen: false })} />
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

function DetailBox({ label, val }: any) {
    return (
        <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-xs font-bold text-slate-700 truncate">{val || '---'}</p>
        </div>
    );
}