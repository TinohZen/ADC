import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Check, X, Plus, Trash2, Edit, MapPin, Clock, Search, TrendingUp, UserPlus, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Calendar, Check, X, Plus, Trash2, Edit, MapPin, Clock, Search, TrendingUp, UserPlus, AlertCircle, User } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'members' | 'meetings'>('members');
  const [users, setUsers] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalMembers: 0,
    pendingMembers: 0,
    totalMeetings: 0,
    averageAttendance: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // New Meeting Form
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', description: '', date: '', time: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch('/api/stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      if (activeTab === 'members') {
        const res = await fetch('/api/users');
        const data = await res.json();
        setUsers(data);
      } else {
        const res = await fetch('/api/meetings');
        const data = await res.json();
        setMeetings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) return;
    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMeeting),
      });
      setShowNewMeeting(false);
      setNewMeeting({ title: '', description: '', date: '', time: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMeeting = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réunion ?')) return;
    try {
      await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
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


  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    return (
      user.first_name.toLowerCase().includes(search) ||
      user.last_name.toLowerCase().includes(search) ||
      user.phone.includes(search)
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Tableau de bord</h2>
          <p className="text-slate-500 text-sm mt-1">Gérez les membres et les réunions de l'association</p>
        </div>
        
        <div className="flex bg-slate-200/50 rounded-xl p-1 border border-slate-200/50">
  <button
    onClick={() => setActiveTab('members')}
    className={`px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
      activeTab === 'members' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
    }`}
  >
    <Users size={16} />
    Membres
  </button>
  <button
    onClick={() => setActiveTab('meetings')}
    className={`px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
      activeTab === 'meetings' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
    }`}
  >
    <Calendar size={16} />
    Réunions
  </button>
  {/* AJOUT DU BOUTON PROFIL ICI */}
  <Link
    to="/profile"
    className="px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
  >
    <User size={16} />
    Profil
  </Link>
</div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Membres</p>
            <h2 className="text-2xl font-bold text-slate-800">{stats.totalMembers}</h2>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <UserPlus size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">En attente</p>
            <h2 className="text-2xl font-bold text-slate-800">{stats.pendingMembers}</h2>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Réunions</p>
            <h2 className="text-2xl font-bold text-slate-800">{stats.totalMeetings}</h2>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">% Présence</p>
            <h2 className="text-2xl font-bold text-slate-800">{stats.averageAttendance}%</h2>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p>Chargement des données...</p>
        </div>
      ) : activeTab === 'members' ? (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un membre par nom, prénom ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
            />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="p-4 pl-6">Membre</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence>
                    {filteredUsers.map((user) => (
                    <motion.tr 
                      key={user.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          {user.photo_url ? (
                            <img src={user.photo_url} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
                              {user.first_name[0]}{user.last_name[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-800">{user.first_name} {user.last_name}</div>
                            <div className="text-xs text-slate-500 capitalize">{user.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-slate-700 font-medium">{user.phone}</div>
                        {user.email && <div className="text-xs text-slate-500">{user.email}</div>}
                      </td>
                      <td className="p-4">
                        {user.status === 'pending' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/50">
                            En attente
                          </span>
                        )}
                        {user.status === 'approved' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                            Approuvé
                          </span>
                        )}
                        {user.status === 'rejected' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200/50">
                            Refusé
                          </span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {user.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(user.id, 'approved')}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Approuver"
                              >
                                <Check size={18} />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(user.id, 'rejected')}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Refuser"
                              >
                                <X size={18} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Search size={40} className="text-slate-300 mb-3" />
                        <p>Aucun membre ne correspond à votre recherche.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex justify-end">
            <button
              onClick={() => setShowNewMeeting(!showNewMeeting)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-sm shadow-emerald-600/20"
            >
              <Plus size={18} />
              Nouvelle réunion
            </button>
          </div>

          <AnimatePresence>
            {showNewMeeting && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 mb-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-5">Planifier une réunion</h3>
                  <form onSubmit={handleCreateMeeting} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Titre</label>
                      <input
                        type="text"
                        value={newMeeting.title}
                        onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                        placeholder="Ex: Assemblée Générale Annuelle"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                      <textarea
                        value={newMeeting.description}
                        onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none"
                        rows={3}
                        placeholder="Ordre du jour..."
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                        <input
                          type="date"
                          value={newMeeting.date}
                          onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Heure</label>
                        <input
                          type="time"
                          value={newMeeting.time}
                          onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowNewMeeting(false)}
                        className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-sm shadow-emerald-600/20"
                      >
                        Enregistrer
                      </button>
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
                <motion.div 
                  key={meeting.id} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col group hover:shadow-md transition-all hover:border-emerald-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-800 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors">{meeting.title}</h3>
                      <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase text-white mt-1 ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <button
                    onClick={() => handleDeleteMeeting(meeting.id)}
                    className="text-slate-300 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 -mr-2 -mt-2 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-slate-500 text-sm mb-5 flex-1 line-clamp-3 leading-relaxed">
                  {meeting.description || 'Aucune description fournie.'}
                </p>
                <div className="flex flex-col gap-2.5 mb-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Calendar size={14} />
                    </div>
                    <span>{format(new Date(meeting.date), 'dd MMMM yyyy', { locale: fr })}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Clock size={14} />
                    </div>
                    <span>{meeting.time}</span>
                  </div>
                </div>
                <Link
                  to={`/meetings/${meeting.id}`}
                  className="w-full py-2.5 bg-slate-50 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl font-semibold text-center transition-colors text-sm border border-slate-100"
                >
                  Gérer les présences
                </Link>
              </motion.div>
              );
            })}
            {meetings.length === 0 && !showNewMeeting && (
              <div className="col-span-full text-center py-16 text-slate-500 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-600">Aucune réunion planifiée</p>
                <p className="text-sm mt-1">Cliquez sur "Nouvelle réunion" pour commencer.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
