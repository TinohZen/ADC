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
  const [meetings, setMeetings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalMembers: 0, pendingMembers: 0, totalMeetings: 0, averageAttendance: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: 0, type: 'user' as any });
  const [popup, setPopup] = useState({ isOpen: false, title: '', msg: '', type: 'success' as any });
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', description: '', date: '', time: '' });

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const s = await (await apiFetch('/api/stats')).json(); setStats(s);
      if (activeTab === 'members') setUsers(await (await apiFetch('/api/users')).json());
      else setMeetings(await (await apiFetch('/api/meetings')).json());
    } finally { setLoading(false); }
  };

  const handleUpdateStatus = async (id: number, status: string, e: any) => {
    e.stopPropagation();
    await apiFetch(`/api/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    setPopup({ isOpen: true, title: 'Succès', msg: `Statut mis à jour.`, type: 'success' });
    fetchData();
  };

  const filteredUsers = users.filter(u => (u.first_name + u.last_name + u.district).toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div><h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Dashboard</h2><p className="text-slate-400 font-bold text-xs uppercase tracking-widest">ADC Admin</p></div>
        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200/50 w-full sm:w-auto">
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
            <input type="text" placeholder="Rechercher..." onChange={(e)=>setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] outline-none shadow-sm focus:border-emerald-500 font-medium" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(u => (
              <motion.div whileHover={{ y: -5 }} onClick={() => setSelectedUser(u)} key={u.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 cursor-pointer hover:shadow-2xl transition-all group">
                <div className="flex items-center gap-4">
                  <img src={u.photo_url || '/placeholder.png'} className="w-16 h-16 rounded-2xl object-cover border-4 border-slate-50 shadow-md group-hover:scale-110 transition-transform" />
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-sm leading-tight uppercase">{u.first_name} {u.last_name}</h3>
                    <div className="flex items-center gap-1 text-emerald-500 font-bold text-[9px] mt-1"><MapPin size={12}/> {u.district || 'N/A'}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {u.status === 'pending' && <button onClick={(e)=>handleUpdateStatus(u.id, 'approved', e)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><Check size={16}/></button>}
                    <button onClick={(e)=>{e.stopPropagation(); setConfirmDelete({isOpen:true, id:u.id, type:'user'})}} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        /* Rendu Meetings similaire... */
        <div className="space-y-6">
           <div className="flex justify-end"><button onClick={()=>setShowNewMeeting(true)} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs flex items-center gap-2"><Plus size={18}/> NOUVELLE RÉUNION</button></div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {meetings.map(m => (
                <div key={m.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative">
                    <button onClick={() => setConfirmDelete({isOpen:true, id:m.id, type:'meeting'})} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                    <h3 className="font-black text-slate-800 text-lg mb-4">{m.title}</h3>
                    <div className="flex gap-4 text-[10px] font-black text-slate-400 mb-6 uppercase">
                        <div className="flex items-center gap-1.5"><Calendar size={14} className="text-emerald-500"/> {format(new Date(m.date), 'dd/MM/yy')}</div>
                        <div className="flex items-center gap-1.5"><Clock size={14} className="text-emerald-500"/> {m.time}</div>
                    </div>
                    <Link to={`/meetings/${m.id}`} className="block w-full text-center py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase">Présences</Link>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* MODAL DÉTAILS MEMBRE */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg p-10 relative overflow-hidden">
              <button onClick={() => setSelectedUser(null)} className="absolute top-8 right-8 p-3 bg-slate-50 text-slate-400 hover:text-slate-800 rounded-full transition-all"><X size={24} /></button>
              <div className="flex flex-col items-center mb-10 text-center">
                <img src={selectedUser.photo_url} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-emerald-50 shadow-2xl mb-6" />
                <h2 className="text-2xl font-black text-slate-800 leading-tight uppercase">{selectedUser.first_name} <br/> {selectedUser.last_name}</h2>
                <div className="mt-4 px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedUser.role} • ADC Madagascar</div>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2.5rem] grid grid-cols-2 gap-6">
                <DetailItem label="District" val={selectedUser.district} />
                <DetailItem label="Région" val={selectedUser.region} />
                <DetailItem label="Province" val={selectedUser.province} />
                <DetailItem label="Commune" val={selectedUser.commune} />
                <div className="col-span-2 pt-4 border-t border-slate-200"><DetailItem label="Téléphone" val={selectedUser.phone} /></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal isOpen={confirmDelete.isOpen} title="Suppression" message="Cette action est irréversible." confirmText="OUI, SUPPRIMER" type="danger" onConfirm={async () => { const url = confirmDelete.type === 'user' ? `/api/users/${confirmDelete.id}` : `/api/meetings/${confirmDelete.id}`; await apiFetch(url, { method: 'DELETE' }); setConfirmDelete({ ...confirmDelete, isOpen: false }); fetchData(); }} onCancel={() => setConfirmDelete({ ...confirmDelete, isOpen: false })} />
      <ConfirmModal isOpen={popup.isOpen} title={popup.title} message={popup.msg} type={popup.type} onlyConfirm onCancel={() => setPopup({ ...popup, isOpen: false })} />
    </div>
  );
}

const StatCard = ({ icon, label, val, color }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
    <div className={`w-14 h-14 rounded-2xl bg-${color}-50 text-${color}-600 flex items-center justify-center shadow-inner`}>{icon}</div>
    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p><h2 className="text-2xl font-black text-slate-800">{val}</h2></div>
  </div>
);

const DetailItem = ({ label, val }: any) => (
  <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p><p className="text-xs font-bold text-slate-700">{val || '---'}</p></div>
);