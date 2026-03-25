import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Users, Calendar, Check, X, Plus, Trash2, Search, TrendingUp, UserPlus, MapPin, Mail, Phone, Clock, Loader2, Home } from 'lucide-react';
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
  const [confirm, setConfirm] = useState({ isOpen: false, id: 0, type: 'user' as any });
  const [popup, setPopup] = useState({ isOpen: false, title: '', msg: '', type: 'success' as any });
  const [showNew, setShowNew] = useState(false);
  const [newM, setNewM] = useState({ title: '', description: '', date: '', time: '' });

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const s = await (await apiFetch('/api/stats')).json(); setStats(s);
      if (activeTab === 'members') setUsers(await (await apiFetch('/api/users')).json());
      else setMeetings(await (await apiFetch('/api/meetings')).json());
    } finally { setLoading(false); }
  };

  const handleStatus = async (id: number, status: string, e: any) => {
    e.stopPropagation();
    await apiFetch(`/api/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    setPopup({ isOpen: true, title: 'Mis à jour', msg: 'Le statut a été modifié.', type: 'success' });
    fetchData();
  };

  const confirmDelete = async () => {
    const url = confirm.type === 'user' ? `/api/users/${confirm.id}` : `/api/meetings/${confirm.id}`;
    await apiFetch(url, { method: 'DELETE' });
    setConfirm({ ...confirm, isOpen: false });
    setPopup({ isOpen: true, title: 'Supprimé', msg: 'Élément retiré avec succès.', type: 'success' });
    fetchData();
  };

  const filtered = users.filter(u => (u.first_name + u.last_name + u.district + u.region).toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div><h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">ADC Admin</h2><p className="text-emerald-600 font-bold text-xs uppercase tracking-[0.3em]">Gestion Nationale Madagascar</p></div>
        <div className="flex bg-white p-2 rounded-3xl shadow-xl border border-slate-100">
          {['members', 'meetings'].map(t => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`px-8 py-3 rounded-2xl text-xs font-black transition-all ${activeTab === t ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>{t.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Membres" val={stats.totalMembers} color="emerald" icon={<Users/>} />
        <StatCard label="Attente" val={stats.pendingMembers} color="amber" icon={<UserPlus/>} />
        <StatCard label="Réunions" val={stats.totalMeetings} color="blue" icon={<Calendar/>} />
        <StatCard label="Présence" val={`${stats.averageAttendance}%`} color="purple" icon={<TrendingUp/>} />
      </div>

      {activeTab === 'members' ? (
        <div className="space-y-6">
          <input type="text" placeholder="Rechercher un membre, un district..." onChange={(e)=>setSearchTerm(e.target.value)} className="w-full p-5 bg-white rounded-[2rem] shadow-sm border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(u => (
              <motion.div whileHover={{ y: -5 }} onClick={() => setSelectedUser(u)} key={u.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 cursor-pointer hover:shadow-2xl transition-all group">
                <div className="flex items-center gap-5">
                  <img src={u.photo_url || '/placeholder.png'} className="w-16 h-16 rounded-[1.5rem] object-cover border-4 border-slate-50 shadow-md group-hover:scale-110 transition-transform" />
                  <div className="flex-1">
                    <h3 className="font-black text-slate-800 text-sm leading-tight uppercase">{u.first_name} {u.last_name}</h3>
                    <div className="flex items-center gap-1 text-emerald-500 font-bold text-[10px] mt-1"><MapPin size={12}/> {u.district || 'N/A'}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {u.status === 'pending' && <button onClick={(e)=>handleStatus(u.id, 'approved', e)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><Check size={16}/></button>}
                    <button onClick={(e)=>{e.stopPropagation(); setConfirm({isOpen:true, id:u.id, type:'user'})}} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
            <div className="flex justify-end"><button onClick={()=>setShowNew(true)} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"><Plus size={20}/> NOUVELLE RÉUNION</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {meetings.map(m => (
                    <div key={m.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                        <h3 className="text-xl font-black text-slate-800 mb-6">{m.title}</h3>
                        <div className="flex gap-6 mb-8">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-400"><Calendar size={18} className="text-emerald-500"/> {format(new Date(m.date), 'dd/MM/yyyy')}</div>
                            <div className="flex items-center gap-2 text-xs font-black text-slate-400"><Clock size={18} className="text-emerald-500"/> {m.time}</div>
                        </div>
                        <Link to={`/meetings/${m.id}`} className="block w-full text-center py-4 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all uppercase tracking-widest">Gérer les présences</Link>
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
              <div className="flex flex-col items-center mb-10">
                <img src={selectedUser.photo_url} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-emerald-50 shadow-2xl mb-6" />
                <h2 className="text-2xl font-black text-slate-800 text-center leading-tight uppercase">{selectedUser.first_name} <br/> {selectedUser.last_name}</h2>
                <div className="mt-4 px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedUser.role} • ADC Madagascar</div>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2.5rem] grid grid-cols-2 gap-6">
                <DetailBox label="District" val={selectedUser.district} />
                <DetailBox label="Région" val={selectedUser.region} />
                <DetailBox label="Commune" val={selectedUser.commune} />
                <DetailBox label="Fokontany" val={selectedUser.fokontany} />
                <div className="col-span-2 pt-4 border-t border-slate-200"><DetailBox label="Téléphone" val={selectedUser.phone} /></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal isOpen={confirm.isOpen} title="Attention" message="Cette action est irréversible." type="danger" onConfirm={confirmDelete} onCancel={() => setConfirm({ ...confirm, isOpen: false })} />
      <ConfirmModal isOpen={popup.isOpen} title={popup.title} message={popup.msg} type={popup.type} onlyConfirm onCancel={() => setPopup({ ...popup, isOpen: false })} />
    </div>
  );
}

const StatCard = ({ icon, label, val, color }: any) => (
  <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-2xl transition-all">
    <div className={`w-14 h-14 rounded-2xl bg-${color}-50 text-${color}-600 flex items-center justify-center shadow-inner`}>{icon}</div>
    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p><h2 className="text-2xl font-black text-slate-800">{val}</h2></div>
  </div>
);
const DetailBox = ({ label, val }: any) => (
  <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p><p className="text-xs font-bold text-slate-700">{val || '---'}</p></div>
);