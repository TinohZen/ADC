import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, Search, TrendingUp, UserCheck } from 'lucide-react';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Calendar, Check, X, Plus, Trash2, Edit, MapPin, Clock, Search, TrendingUp, UserPlus, User } from 'lucide-react';

export default function MemberDashboard() {
  const [activeTab, setActiveTab] = useState<'meetings' | 'members'>('meetings');
  const [meetings, setMeetings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalMembers: 0,
    totalMeetings: 0,
    averageAttendance: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch('/api/stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      if (activeTab === 'meetings') {
        const res = await fetch('/api/meetings');
        const data = await res.json();
        setMeetings(data);
      } else {
        const res = await fetch('/api/users');
        const data = await res.json();
        // Only show approved members to other members
        setUsers(data.filter((u: any) => u.status === 'approved'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMeetingStatus = (date: string, time: string) => {
    const meetingDate = parseISO(`${date}T${time}`);
    const now = new Date();
    
    // Simple logic: if same day and within 2 hours, it's "En cours"
    // If before, it's "À venir"
    // If after, it's "Passée"
    
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
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Espace Membre</h2>
          <p className="text-slate-500 text-sm mt-1">Consultez les activités de l'association</p>
        </div>

        <div className="flex bg-slate-200/50 rounded-xl p-1 border border-slate-200/50">
          <button
            onClick={() => setActiveTab('meetings')}
            className={`px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              activeTab === 'meetings' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar size={16} />
            Réunions
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              activeTab === 'members' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={16} />
            Membres
          </button>

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
      ) : activeTab === 'meetings' ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {meetings.map((meeting) => {
            const status = getMeetingStatus(meeting.date, meeting.time);
            return (
              <motion.div 
                key={meeting.id} 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-all hover:border-emerald-200 group"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-slate-800 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors">{meeting.title}</h3>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase text-white ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mb-5 flex-1 line-clamp-3 leading-relaxed">
                  {meeting.description || 'Aucune description fournie.'}
                </p>
                
                <div className="flex flex-col gap-2.5 mb-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Calendar size={14} />
                    </div>
                    <span>{format(new Date(meeting.date), 'EEEE d MMMM yyyy', { locale: fr })}</span>
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
                  Voir les détails
                </Link>
              </motion.div>
            );
          })}
          {meetings.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-500 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
              <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-600">Aucune réunion planifiée</p>
              <p className="text-sm mt-1">Vous serez notifié lorsqu'une nouvelle réunion sera créée.</p>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un membre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
            />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
                {user.photo_url ? (
                  <img src={user.photo_url} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-100" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
                    {user.first_name[0]}{user.last_name[0]}
                  </div>
                )}
                <div>
                  <div className="font-bold text-slate-800">{user.first_name} {user.last_name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <UserCheck size={12} className="text-emerald-500" />
                    Membre actif
                  </div>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-400">
                <Search size={40} className="mx-auto mb-3 opacity-20" />
                <p>Aucun membre trouvé.</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
