import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Users, Calendar, Check, X, Plus, Trash2, Search, 
  TrendingUp, UserPlus, User, MapPin, Mail, Phone, Home 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../lib/apiFetch';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'members' | 'meetings'>('members');
  const [users, setUsers] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalMembers: 0, pendingMembers: 0, totalMeetings: 0, averageAttendance: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

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

  const handleDeleteUser = async (id: number, e: any) => {
    e.stopPropagation();
    if (!confirm('Supprimer ce membre ?')) return;
    try {
      await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleCreateMeeting = async (e: any) => {
    e.preventDefault();
    try {
      await apiFetch('/api/meetings', { method: 'POST', body: JSON.stringify(newMeeting) });
      setShowNewMeeting(false);
      setNewMeeting({ title: '', description: '', date: '', time: '' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const filteredUsers = users.filter(u => {
    const s = searchTerm.toLowerCase();
    return u.first_name.toLowerCase().includes(s) || u.last_name.toLowerCase().includes(s) || 
           u.phone.includes(s) || u.district?.toLowerCase().includes(s) || u.region?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Tableau de bord Admin</h2>
        <div className="flex bg-slate-200/50 p-1 rounded-xl">
          <button onClick={() => setActiveTab('members')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'members' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'}`}>Membres</button>
          <button onClick={() => setActiveTab('meetings')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'meetings' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'}`}>Réunions</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Membres" val={stats.totalMembers} icon={<Users/>} />
        <StatCard label="En attente" val={stats.pendingMembers} icon={<UserPlus/>} />
        <StatCard label="Réunions" val={stats.totalMeetings} icon={<Calendar/>} />
        <StatCard label="% Présence" val={`${stats.averageAttendance}%`} icon={<TrendingUp/>} />
      </div>

      {activeTab === 'members' ? (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Rechercher un membre, une région, un district..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none" />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-[10px] uppercase text-slate-400 font-bold">
                <tr><th className="p-4 pl-6">Membre</th><th className="p-4">Localisation</th><th className="p-4">Statut</th><th className="p-4 pr-6 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((u) => (
                  <tr key={u.id} onClick={() => setSelectedUser(u)} className="hover:bg-slate-50 cursor-pointer group transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <img src={u.photo_url} className="w-10 h-10 rounded-full object-cover border" />
                        <div><div className="font-bold text-slate-800">{u.first_name} {u.last_name}</div><div className="text-[10px] text-slate-400">{u.phone}</div></div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs font-bold text-slate-700">{u.district}</div>
                      <div className="text-[10px] text-emerald-600 font-bold uppercase">{u.region} • {u.province}</div>
                    </td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${u.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{u.status}</span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                        {u.status === 'pending' && <button onClick={(e) => handleUpdateStatus(u.id, 'approved', e)} className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg"><Check size={14}/></button>}
                        <button onClick={(e) => handleDeleteUser(u.id, e)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Logique des réunions ici (identique) */}
        </div>
      )}

      {/* MODAL DÉTAILS */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 relative">
              <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 p-2 text-slate-400"><X size={24} /></button>
              <div className="flex items-center gap-4 mb-8">
                <img src={selectedUser.photo_url} className="w-20 h-20 rounded-2xl object-cover border-4 border-slate-50 shadow-sm" />
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedUser.first_name} {selectedUser.last_name}</h2>
                  <p className="text-emerald-600 font-bold text-[10px] uppercase">{selectedUser.region} • {selectedUser.province}</p>
                </div>
              </div>
              <div className="space-y-4 border-t pt-6">
                <DetailItem label="District" val={selectedUser.district} />
                <DetailItem label="Commune" val={selectedUser.commune} />
                <DetailItem label="Fokontany" val={selectedUser.fokontany} />
                <DetailItem label="Email" val={selectedUser.email} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const StatCard = ({ label, val, icon }: any) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-600">{icon}</div>
    <div><p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p><h2 className="text-lg font-bold text-slate-800">{val}</h2></div>
  </div>
);

const DetailItem = ({ label, val }: any) => (
  <div><p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p><p className="font-bold text-slate-700">{val || '---'}</p></div>
);