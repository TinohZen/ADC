import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Users, Calendar, Check, X, Plus, Trash2, Clock, Search, 
  TrendingUp, UserPlus, User, MapPin, Mail, Phone, Home 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../lib/apiFetch';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'members' | 'meetings'>('members');
  const [users, setUsers] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalMembers: 0, pendingMembers: 0, totalMeetings: 0, averageAttendance: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // État pour le membre sélectionné (Détails)
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Nouvelles réunions
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', description: '', date: '', time: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await apiFetch('/api/stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      if (activeTab === 'members') {
        const res = await apiFetch('/api/users');
        const data = await res.json();
        setUsers(data);
      } else {
        const res = await apiFetch('/api/meetings');
        const data = await res.json();
        setMeetings(data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleUpdateStatus = async (id: number, status: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêche d'ouvrir les détails au clic sur le bouton
    try {
      await apiFetch(`/api/users/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteUser = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Supprimer ce membre définitivement ?')) return;
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

  const filteredUsers = users.filter(user => {
    const s = searchTerm.toLowerCase();
    return (
      user.first_name.toLowerCase().includes(s) ||
      user.last_name.toLowerCase().includes(s) ||
      user.phone.includes(s) ||
      user.province?.toLowerCase().includes(s) ||
      user.region?.toLowerCase().includes(s) ||
      user.district?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Tableau de bord Admin</h2>
          <p className="text-slate-500 text-sm mt-1">Gérez l'association ADC</p>
        </div>
        <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200/50">
          <button onClick={() => setActiveTab('members')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'members' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'}`}>
            <Users size={18} /> Membres
          </button>
          <button onClick={() => setActiveTab('meetings')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'meetings' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'}`}>
            <Calendar size={18} /> Réunions
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users/>} label="Membres" val={stats.totalMembers} color="emerald" />
        <StatCard icon={<UserPlus/>} label="En attente" val={stats.pendingMembers} color="amber" />
        <StatCard icon={<Calendar/>} label="Réunions" val={stats.totalMeetings} color="blue" />
        <StatCard icon={<TrendingUp/>} label="% Présence" val={`${stats.averageAttendance}%`} color="purple" />
      </div>

      {loading ? (
        <div className="text-center py-20"><div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto"></div></div>
      ) : activeTab === 'members' ? (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Rechercher par nom, téléphone, province, région ou district..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none shadow-sm focus:ring-2 focus:ring-emerald-500/20" />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-bold">
                  <th className="p-4 pl-6">Membre</th>
                  <th className="p-4">Localisation</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} onClick={() => setSelectedUser(user)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <img src={user.photo_url} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        <div>
                          <div className="font-semibold text-slate-800">{user.first_name} {user.last_name}</div>
                          <div className="text-[10px] text-slate-500">{user.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs font-medium text-slate-700">{user.district}</div>
                      <div className="text-[10px] text-emerald-600 font-bold uppercase">{user.region} • {user.province}</div>
                    </td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {user.status === 'approved' ? 'Approuvé' : 'En attente'}
                        </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {user.status === 'pending' && (
                          <>
                            <button onClick={(e) => handleUpdateStatus(user.id, 'approved', e)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Check size={16}/></button>
                            <button onClick={(e) => handleUpdateStatus(user.id, 'rejected', e)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><X size={16}/></button>
                          </>
                        )}
                        <button onClick={(e) => handleDeleteUser(user.id, e)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Meetings Section (Identique au code précédent) */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ... Liste des réunions et bouton nouvelle réunion ... */}
        </div>
      )}

      {/* MODAL DE DÉTAILS DU MEMBRE */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <img src={selectedUser.photo_url} className="w-20 h-20 rounded-2xl object-cover border-4 border-slate-50 shadow-sm" />
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{selectedUser.first_name} {selectedUser.last_name}</h2>
                      <p className="text-emerald-600 font-bold text-[10px] uppercase tracking-wider">{selectedUser.role} • {selectedUser.status}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24} /></button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm"><Phone size={14}/></div>
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase">Téléphone</p><p className="text-sm font-bold text-slate-800">{selectedUser.phone}</p></div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm"><Mail size={14}/></div>
                      <div className="min-w-0"><p className="text-[10px] font-bold text-slate-400 uppercase">Email</p><p className="text-sm font-bold text-slate-800 truncate">{selectedUser.email}</p></div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-widest"><MapPin size={14} className="text-emerald-500" /> Adresse Complète</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                      <AddressField label="Province" val={selectedUser.province} />
                      <AddressField label="Région" val={selectedUser.region} />
                      <AddressField label="District" val={selectedUser.district} />
                      <AddressField label="Commune" val={selectedUser.commune} />
                      <div className="col-span-2"><AddressField label="Fokontany" val={selectedUser.fokontany} /></div>
                    </div>
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

// Sous-composants utilitaires
const StatCard = ({ icon, label, val, color }: any) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
    <div className={`w-10 h-10 rounded-xl bg-${color}-50 text-${color}-600 flex items-center justify-center`}>{icon}</div>
    <div><p className="text-[10px] font-bold text-slate-500 uppercase">{label}</p><h2 className="text-xl font-bold text-slate-800">{val}</h2></div>
  </div>
);

const AddressField = ({ label, val }: any) => (
  <div><p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p><p className="text-sm font-semibold text-slate-700">{val || '---'}</p></div>
);