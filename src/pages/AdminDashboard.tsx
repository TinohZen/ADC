import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Users, Calendar, Check, X, Plus, Trash2, Search, TrendingUp, 
  UserPlus, MapPin, Mail, Phone, Clock, Loader2, UserCheck, 
  CreditCard, Printer, Tag, ShieldAlert 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../lib/apiFetch';
import ConfirmModal from '../components/ConfirmModal';
import SylobFilterBuilder from '../components/common/SylobFilterBuilder';
import { evaluateSylobRules } from '../utils/sylobFilterEngine';
import { FilterFieldDef, FilterRule, MatchMode } from '../types/sylobFilter';
import MemberBadge from '../components/badges/MemberBadge';

const MEMBER_FILTER_FIELDS: FilterFieldDef[] = [
  { key: 'first_name', label: 'Prénom', type: 'text', category: 'Identité' },
  { key: 'last_name', label: 'Nom', type: 'text', category: 'Identité' },
  { key: 'phone', label: 'Téléphone', type: 'text', category: 'Contact' },
  { key: 'email', label: 'Email', type: 'text', category: 'Contact' },
  {
    key: 'role',
    label: 'Rôle',
    type: 'select',
    category: 'Permissions',
    options: [
      { label: 'Admin', value: 'admin' },
      { label: 'Chef', value: 'chef' },
      { label: 'Membre', value: 'member' },
    ],
  },
  {
    key: 'status',
    label: 'Statut',
    type: 'select',
    category: 'Statut',
    options: [
      { label: 'Approuvé', value: 'approved' },
      { label: 'En attente', value: 'pending' },
      { label: 'Refusé', value: 'rejected' },
    ],
  },
  { key: 'province', label: 'Province', type: 'text', category: 'Localisation' },
  { key: 'region', label: 'Région', type: 'text', category: 'Localisation' },
  { key: 'district', label: 'District', type: 'text', category: 'Localisation' },
  { key: 'commune', label: 'Commune', type: 'text', category: 'Localisation' },
  { key: 'fokontany', label: 'Fokontany', type: 'text', category: 'Localisation' },
  { key: 'created_at', label: 'Date inscription', type: 'date', category: 'Système' },
];

const MEETING_FILTER_FIELDS: FilterFieldDef[] = [
  { key: 'title', label: 'Titre de la réunion', type: 'text', category: 'Réunion' },
  { key: 'date', label: 'Date', type: 'date', category: 'Réunion' },
  { key: 'time', label: 'Heure', type: 'text', category: 'Réunion' },
  { key: 'description', label: 'Description', type: 'text', category: 'Détails' },
];

const ACTIVITY_PRESETS = [
  "Carte d'Adhérent Officielle",
  "Convention Nationale 2026",
  "Assemblée Générale Ordinaire",
  "Réunion Régionale des Cadres",
  "Accréditation Sécurité / Staff",
];

export default function AdminDashboard({ initialTab }: { initialTab?: 'members' | 'meetings' | 'badges' }) {
  const [activeTab, setActiveTab] = useState<'members' | 'meetings' | 'badges'>(initialTab || 'members');
  const [users, setUsers] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalMembers: 0, pendingMembers: 0, totalMeetings: 0, averageAttendance: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedActivity, setSelectedActivity] = useState(ACTIVITY_PRESETS[0]);
  const [customActivity, setCustomActivity] = useState('');
  const [singlePrintUser, setSinglePrintUser] = useState<any>(null);

  const [memberRules, setMemberRules] = useState<FilterRule[]>([]);
  const [memberMatchMode, setMemberMatchMode] = useState<MatchMode>('all');

  const [meetingRules, setMeetingRules] = useState<FilterRule[]>([]);
  const [meetingMatchMode, setMeetingMatchMode] = useState<MatchMode>('all');

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: 0, type: 'user' as any });
  const [popup, setPopup] = useState({ isOpen: false, title: '', msg: '', type: 'success' as any });
  const [actionLoading, setActionLoading] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState(false);

  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', description: '', date: '', time: '' });

  const userStr = localStorage.getItem('adc_user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = currentUser?.role === 'admin';
  const dashboardTitle = currentUser?.role === 'chef' ? 'ADC Chef' : 'ADC Admin';

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const s = await (await apiFetch('/api/stats')).json();
      setStats(s);
      if (activeTab === 'members' || activeTab === 'badges') {
        setUsers(await (await apiFetch('/api/users')).json());
      } else {
        setMeetings(await (await apiFetch('/api/meetings')).json());
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (date: string, time: string) => {
    const d = parseISO(`${date}T${time}`);
    const now = new Date();
    if (d > now) return { label: 'À venir', color: 'bg-blue-500' };
    if (Math.abs(d.getTime() - now.getTime()) < 2 * 60 * 60 * 1000) return { label: 'En cours', color: 'bg-emerald-500' };
    return { label: 'Passée', color: 'bg-slate-400' };
  };

  const handleStatus = async (id: number, status: string, e?: any) => {
    if (e) e.stopPropagation();
    await apiFetch(`/api/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    setPopup({ isOpen: true, title: 'Mis à jour', msg: 'Le statut a été modifié.', type: 'success' });
    fetchData();
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (!isSuperAdmin) return;
    setRoleUpdating(true);
    try {
      const res = await apiFetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error();
      
      setSelectedUser((prev: any) => prev ? { ...prev, role: newRole } : null);
      setPopup({ isOpen: true, title: 'Rôle Modifié', msg: `Le rôle a été changé en ${newRole.toUpperCase()}.`, type: 'success' });
      fetchData();
    } catch {
      setPopup({ isOpen: true, title: 'Erreur', msg: 'Impossible de modifier le rôle.', type: 'danger' });
    } finally {
      setRoleUpdating(false);
    }
  };

  const executeDelete = async () => {
    setActionLoading(true);
    try {
      const url = confirmDelete.type === 'user' ? `/api/users/${confirmDelete.id}` : `/api/meetings/${confirmDelete.id}`;
      await apiFetch(url, { method: 'DELETE' });
      setConfirmDelete({ ...confirmDelete, isOpen: false });
      setPopup({ isOpen: true, title: 'Supprimé', msg: 'Élément retiré avec succès.', type: 'success' });
      fetchData();
    } finally {
      setActionLoading(false);
    }
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
    } finally {
      setActionLoading(false);
    }
  };

  const displayedUsers = useMemo(() => {
    let result = users;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((u) =>
        (u.first_name + ' ' + u.last_name + ' ' + (u.district || '') + ' ' + (u.phone || '')).toLowerCase().includes(q)
      );
    }
    return evaluateSylobRules(result, memberRules, memberMatchMode, MEMBER_FILTER_FIELDS);
  }, [users, searchTerm, memberRules, memberMatchMode]);

  const displayedMeetings = useMemo(() => {
    let result = meetings;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((m) =>
        (m.title + ' ' + (m.description || '')).toLowerCase().includes(q)
      );
    }
    return evaluateSylobRules(result, meetingRules, meetingMatchMode, MEETING_FILTER_FIELDS);
  }, [meetings, searchTerm, meetingRules, meetingMatchMode]);

  const currentActivityTitle = customActivity.trim() ? customActivity.trim() : selectedActivity;

  const handlePrintAllBadges = () => {
    setSinglePrintUser(null);
    setTimeout(() => { window.print(); }, 150);
  };

  const handlePrintSingle = (targetUser: any) => {
    setSinglePrintUser(targetUser);
    setTimeout(() => { window.print(); }, 150);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 font-sans">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-section, #print-section * { visibility: visible; }
          #print-section { position: absolute; left: 0; top: 0; width: 100%; background: white !important; }
          .print-badge-grid { display: flex !important; flex-wrap: wrap !important; justify-content: center !important; gap: 10mm !important; }
          @page { size: A4 portrait; margin: 10mm; }
        }
      `}</style>

      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 tracking-tight uppercase">
            {dashboardTitle}
          </h2>
          <p className="text-emerald-600 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] mt-0.5">
            Gestion Nationale
          </p>
        </div>
        
        <div className="bg-white p-1 sm:p-1.5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex items-center gap-1 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 sm:flex-none px-3.5 sm:px-6 py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'members' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Users size={14} /> Membres
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`flex-1 sm:flex-none px-3.5 sm:px-6 py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'meetings' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Calendar size={14} /> Réunions
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 sm:flex-none px-3.5 sm:px-6 py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'badges' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <CreditCard size={14} /> Badges
          </button>
        </div>
      </div>

      {/* STATS KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 print:hidden">
        <StatCard label="Membres" val={stats.totalMembers} color="emerald" icon={<Users size={20} />} />
        <StatCard label="En Attente" val={stats.pendingMembers} color="amber" icon={<UserPlus size={20} />} />
        <StatCard label="Réunions" val={stats.totalMeetings} color="blue" icon={<Calendar size={20} />} />
        <StatCard label="Présence" val={`${stats.averageAttendance}%`} color="purple" icon={<TrendingUp size={20} />} />
      </div>

      {/* FILTRES SYLOB */}
      <div className="print:hidden">
        {activeTab === 'members' && (
          <SylobFilterBuilder
            fields={MEMBER_FILTER_FIELDS}
            rules={memberRules}
            matchMode={memberMatchMode}
            totalCount={displayedUsers.length}
            onApply={(rules, mode) => {
              setMemberRules(rules);
              setMemberMatchMode(mode);
            }}
          />
        )}

        {activeTab === 'meetings' && (
          <SylobFilterBuilder
            fields={MEETING_FILTER_FIELDS}
            rules={meetingRules}
            matchMode={meetingMatchMode}
            totalCount={displayedMeetings.length}
            onApply={(rules, mode) => {
              setMeetingRules(rules);
              setMeetingMatchMode(mode);
            }}
          />
        )}

        {activeTab === 'badges' && (
          <SylobFilterBuilder
            fields={MEMBER_FILTER_FIELDS}
            rules={memberRules}
            matchMode={memberMatchMode}
            totalCount={displayedUsers.length}
            onApply={(rules, mode) => {
              setMemberRules(rules);
              setMemberMatchMode(mode);
            }}
          />
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 print:hidden">
          <Loader2 size={36} className="animate-spin text-emerald-500" />
        </div>
      ) : activeTab === 'members' ? (
        <div className="space-y-4 sm:space-y-6 print:hidden">
          <div className="relative group">
            <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500" size={18} />
            <input
              type="text"
              placeholder="Recherche rapide nom, téléphone, district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 sm:pl-14 pr-4 py-3.5 sm:py-4.5 bg-white rounded-2xl sm:rounded-[2rem] shadow-xs border border-slate-100 outline-none font-bold text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {displayedUsers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold text-xs sm:text-sm">
              Aucun adhérent trouvé.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {displayedUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] shadow-xs border border-slate-100 cursor-pointer hover:shadow-md transition-all flex items-center justify-between gap-3 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {u.photo_url && u.photo_url !== 'EMPTY' ? (
                      <img src={u.photo_url} className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl object-cover shrink-0 border border-slate-100" />
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-700 font-black text-sm flex items-center justify-center shrink-0">
                        {u.first_name?.[0]}{u.last_name?.[0]}
                      </div>
                    )}
                    <div className="truncate">
                      <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm truncate uppercase">{u.first_name} {u.last_name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                          u.role === 'admin' ? 'bg-rose-50 text-rose-600' :
                          u.role === 'chef' ? 'bg-amber-50 text-amber-700' :
                          'bg-emerald-50 text-emerald-600'
                        }`}>
                          {u.role}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold truncate">{u.district || u.province}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {u.status === 'pending' && (
                      <button
                        onClick={(e) => handleStatus(u.id, 'approved', e)}
                        className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                        title="Valider"
                      >
                        <Check size={15} />
                      </button>
                    )}
                    {isSuperAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete({ isOpen: true, id: u.id, type: 'user' });
                        }}
                        className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'meetings' ? (
        /* ==================== RÉUNIONS AVEC BOUTON SUPPRIMER TOUJOURS VISIBLE ==================== */
        <div className="space-y-4 sm:space-y-6 print:hidden">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input
                type="text"
                placeholder="Rechercher une réunion..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white rounded-xl sm:rounded-2xl border border-slate-100 outline-none text-xs font-bold text-slate-700"
              />
            </div>
            <button
              onClick={() => setShowNewMeeting(true)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Plus size={16} /> Nouvelle réunion
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {displayedMeetings.map((m) => {
              const s = getStatus(m.date, m.time);
              return (
                <div key={m.id} className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <h3 className="text-base sm:text-lg font-black text-slate-800 line-clamp-2">{m.title}</h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase text-white rounded-md ${s.color}`}>{s.label}</span>
                        {/* BOUTON SUPPRIMER RÉUNION PERMANENT ET CLIQUEABLE */}
                        {isSuperAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete({ isOpen: true, id: m.id, type: 'meeting' });
                            }}
                            className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                            title="Supprimer la réunion"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs line-clamp-2 mb-4">{m.description || 'Aucune description'}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4">
                      <span className="flex items-center gap-1"><Calendar size={13} className="text-emerald-500" /> {format(new Date(m.date), 'dd/MM/yyyy')}</span>
                      <span className="flex items-center gap-1"><Clock size={13} className="text-emerald-500" /> {m.time}</span>
                    </div>
                    <Link to={`/meetings/${m.id}`} className="block w-full text-center py-3 bg-slate-900 text-white rounded-xl sm:rounded-2xl font-black text-xs hover:bg-emerald-600 transition-colors uppercase tracking-wider">
                      Gérer présences
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ==================== BADGES ET IMPRESSION ==================== */
        <div className="space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Tag size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">Activité sur les Badges</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Titre officiel imprimé</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <select
                value={selectedActivity}
                onChange={(e) => { setSelectedActivity(e.target.value); setCustomActivity(''); }}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                {ACTIVITY_PRESETS.map((act) => <option key={act} value={act}>{act}</option>)}
              </select>

              <button
                onClick={handlePrintAllBadges}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Printer size={15} /> Imprimer {displayedUsers.length} badges (A4)
              </button>
            </div>
          </div>

          <div id="print-section">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print-badge-grid">
              {(singlePrintUser ? [singlePrintUser] : displayedUsers).map((u) => (
                <MemberBadge key={u.id} user={u} activityName={currentActivityTitle} onPrintSingle={handlePrintSingle} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRÉATION RÉUNION */}
      <AnimatePresence>
        {showNewMeeting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="bg-white p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-xl">
              <h3 className="text-xl font-black text-slate-800 mb-5 text-center">Nouvelle Réunion</h3>
              <form onSubmit={handleCreateMeeting} className="space-y-3.5">
                <input type="text" placeholder="Titre de la réunion" value={newMeeting.title} onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-emerald-500" required />
                <textarea placeholder="Description / Ordre du jour" value={newMeeting.description} onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs h-28 outline-none focus:border-emerald-500" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={newMeeting.date} onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })} className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none text-slate-600" required />
                  <input type="time" value={newMeeting.time} onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })} className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none text-slate-600" required />
                </div>
                <div className="flex gap-2.5 pt-3">
                  <button type="button" onClick={() => setShowNewMeeting(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-black text-xs text-slate-500 uppercase cursor-pointer">Annuler</button>
                  <button type="submit" disabled={actionLoading} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase shadow-md flex justify-center items-center gap-2 cursor-pointer">
                    {actionLoading && <Loader2 size={14} className="animate-spin" />} Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL PROFIL ADHÉRENT AVEC CHANGEMENT DE RÔLE HIÉRARCHIQUE */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-lg p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto no-scrollbar">
              <button onClick={() => setSelectedUser(null)} className="absolute top-5 right-5 p-2 bg-slate-100 text-slate-400 hover:text-slate-800 rounded-full transition-all cursor-pointer"><X size={18} /></button>
              
              <div className="flex flex-col items-center mb-6 text-center">
                {selectedUser.photo_url && selectedUser.photo_url !== 'EMPTY' ? (
                  <img src={selectedUser.photo_url} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl object-cover border-4 border-emerald-50 shadow-md mb-3" />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-2xl mb-3">
                    {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
                  </div>
                )}
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 uppercase">{selectedUser.first_name} {selectedUser.last_name}</h2>
                <span className={`mt-1 px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                  selectedUser.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {selectedUser.status === 'approved' ? 'Compte Validé' : 'En attente'}
                </span>
              </div>

              {/* BOÎTE D'ATTRIBUTION DU RÔLE (ADMIN SEULEMENT) */}
              {isSuperAdmin && (
                <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-emerald-600" />
                      Modifier le Rôle Hiérarchique
                    </span>
                    {roleUpdating && <Loader2 size={13} className="animate-spin text-emerald-600" />}
                  </div>
                  <select
                    value={selectedUser.role}
                    disabled={roleUpdating}
                    onChange={(e) => handleRoleChange(selectedUser.id, e.target.value)}
                    className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="member">Membre Simple</option>
                    <option value="chef">Chef de Fil (Gestionnaire Régional)</option>
                    <option value="admin">Administrateur Principal</option>
                  </select>
                </div>
              )}

              <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl grid grid-cols-2 gap-3 sm:gap-4 text-left">
                <DetailBox label="Province" val={selectedUser.province} />
                <DetailBox label="Région" val={selectedUser.region} />
                <DetailBox label="District" val={selectedUser.district} />
                <DetailBox label="Commune" val={selectedUser.commune} />
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-3">
                    <DetailBox label="Téléphone" val={selectedUser.phone} />
                    <DetailBox label="Email" val={selectedUser.email} />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal isOpen={confirmDelete.isOpen} title="Supprimer ?" message="Cette action est irréversible." confirmText="Oui, supprimer" type="danger" loading={actionLoading} onConfirm={executeDelete} onCancel={() => setConfirmDelete({ ...confirmDelete, isOpen: false })} />
      <ConfirmModal isOpen={popup.isOpen} title={popup.title} message={popup.msg} type={popup.type} onlyConfirm onCancel={() => setPopup({ ...popup, isOpen: false })} />
    </div>
  );
}

function StatCard({ icon, label, val, color }: any) {
  return (
    <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-xs flex items-center gap-3 sm:gap-4">
      <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-${color}-50 text-${color}-600 flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <h2 className="text-base sm:text-xl font-black text-slate-800 truncate">{val}</h2>
      </div>
    </div>
  );
}

function DetailBox({ label, val }: any) {
  return (
    <div>
      <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-xs font-bold text-slate-700 truncate">{val || '---'}</p>
    </div>
  );
}