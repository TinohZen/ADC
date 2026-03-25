import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
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
  const [confirm, setConfirm] = useState({ isOpen: false, id: 0, type: 'user' as any });
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

  const getStatus = (date: string, time: string) => {
    const d = parseISO(`${date}T${time}`);
    const now = new Date();
    if (d > now) return { label: 'À venir', color: 'bg-blue-500' };
    if (Math.abs(d.getTime() - now.getTime()) < 2 * 60 * 60 * 1000) return { label: 'En cours', color: 'bg-emerald-500' };
    return { label: 'Passée', color: 'bg-slate-400' };
  };

  const filtered = users.filter(u => (u.first_name + u.last_name + (u.district || '')).toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div><h2 className="text-3xl font-bold text-slate-800">Tableau de bord Admin</h2></div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setActiveTab('members')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'members' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}>Membres</button>
          <button onClick={() => setActiveTab('meetings')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'meetings' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}>Réunions</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Membres" val={stats.totalMembers} icon={<Users/>} />
        <StatCard label="Attente" val={stats.pendingMembers} icon={<UserPlus/>} />
        <StatCard label="Réunions" val={stats.totalMeetings} icon={<Calendar/>} />
        <StatCard label="Présence" val={`${stats.averageAttendance}%`} icon={<TrendingUp/>} />
      </div>

      {activeTab === 'members' ? (
        <div className="space-y-4">
          <input type="text" placeholder="Rechercher..." onChange={(e)=>setSearchTerm(e.target.value)} className="w-full p-4 bg-white rounded-2xl border shadow-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr><th className="p-4 pl-6">Membre</th><th className="p-4">Localisation</th><th className="p-4">Statut</th><th className="p-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(u => (
                  <tr key={u.id} onClick={() => setSelectedUser(u)} className="hover:bg-slate-50 cursor-pointer">
                    <td className="p-4 pl-6 font-bold text-slate-800">{u.first_name} {u.last_name}</td>
                    <td className="p-4 text-sm text-slate-600">{u.district}, {u.region}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${u.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100'}`}>{u.status}</span></td>
                    <td className="p-4 text-right">
                        <button onClick={(e)=>{e.stopPropagation(); setConfirm({isOpen:true, id:u.id, type:'user'})}} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {meetings.map(m => { const s = getStatus(m.date, m.time); return (
                <div key={m.id} className="bg-white p-6 rounded-2xl border shadow-sm">
                    <div className="flex justify-between mb-4">
                        <h3 className="font-bold text-slate-800">{m.title}</h3>
                        <span className={`px-2 py-1 text-[10px] font-bold text-white rounded-md ${s.color}`}>{s.label}</span>
                    </div>
                    <Link to={`/meetings/${m.id}`} className="block w-full text-center py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm">Gérer les présences</Link>
                </div>
            )})}
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
            <div className="bg-white p-8 rounded-3xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold">{selectedUser.first_name} {selectedUser.last_name}</h2>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p>District: {selectedUser.district}</p><p>Commune: {selectedUser.commune}</p><p>Fokontany: {selectedUser.fokontany}</p>
                    <p>Email: {selectedUser.email}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="mt-6 w-full py-2 bg-slate-100 rounded-xl font-bold">Fermer</button>
            </div>
        </div>
      )}
      <ConfirmModal isOpen={confirm.isOpen} title="Supprimer" message="Continuer ?" type="danger" onConfirm={async() => { await apiFetch(confirm.type === 'user' ? `/api/users/${confirm.id}` : `/api/meetings/${confirm.id}`, { method: 'DELETE' }); setConfirm({...confirm, isOpen: false}); fetchData(); }} onCancel={() => setConfirm({...confirm, isOpen: false})} />
    </div>
  );
}

const StatCard = ({ label, val, icon, color }: any) => (
  <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-lg bg-${color}-50 text-${color}-600`}>{icon}</div>
    <div><p className="text-[10px] font-bold text-slate-400">{label}</p><h2 className="text-lg font-bold">{val}</h2></div>
  </div>
);