import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Check, X, Calendar, Clock, FileText, 
  Edit3, Save, Loader2, Users, Search, CheckCircle2, XCircle, 
  BarChart3, Info, MapPin, QrCode 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../lib/apiFetch';
import ConfirmModal from '../components/ConfirmModal';
import SylobFilterBuilder from '../components/common/SylobFilterBuilder';
import { evaluateSylobRules } from '../utils/sylobFilterEngine';
import { FilterFieldDef, FilterRule, MatchMode } from '../types/sylobFilter';
import QrScannerModal from '../components/meetings/QrScannerModal';

const ATTENDANCE_FILTER_FIELDS: FilterFieldDef[] = [
  { key: 'first_name', label: 'Prénom', type: 'text', category: 'Identité' },
  { key: 'last_name', label: 'Nom', type: 'text', category: 'Identité' },
  { key: 'phone', label: 'Téléphone', type: 'text', category: 'Contact' },
  {
    key: 'status',
    label: 'Statut émargement',
    type: 'select',
    category: 'Présence',
    options: [
      { label: 'Présent(e)', value: 'present' },
      { label: 'Absent(e)', value: 'absent' },
    ],
  },
  { key: 'district', label: 'District', type: 'text', category: 'Localisation' },
  { key: 'region', label: 'Région', type: 'text', category: 'Localisation' },
  { key: 'province', label: 'Province', type: 'text', category: 'Localisation' },
];

export default function MeetingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'attendance' | 'report' | 'analytics' | 'info'>('attendance');
  const [meeting, setMeeting] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [quickFilter, setQuickFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
  const [matchMode, setMatchMode] = useState<MatchMode>('all');

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', date: '', time: '' });
  const [savingInfo, setSavingInfo] = useState(false);

  const [report, setReport] = useState('');
  const [savingReport, setSavingReport] = useState(false);
  const [popup, setPopup] = useState({ isOpen: false, title: '', msg: '', type: 'success' as any });

  const userStr = localStorage.getItem('adc_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const canManage = user?.role === 'admin' || user?.role === 'chef';

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [meetingRes, attendanceRes] = await Promise.all([
        apiFetch('/api/meetings'),
        apiFetch(`/api/meetings/${id}/attendance`),
      ]);
      const meetingsData = await meetingRes.json();
      const currentMeeting = meetingsData.find((m: any) => m.id === Number(id));

      setMeeting(currentMeeting);
      setEditForm({
        title: currentMeeting?.title || '',
        description: currentMeeting?.description || '',
        date: currentMeeting?.date || '',
        time: currentMeeting?.time || '',
      });
      setReport(currentMeeting?.report || '');

      const attendanceData = await attendanceRes.json();
      setAttendance(attendanceData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMeetingInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    setSavingInfo(true);
    try {
      await apiFetch(`/api/meetings/${id}`, { method: 'PUT', body: JSON.stringify(editForm) });
      setMeeting({ ...meeting, ...editForm });
      setIsEditingInfo(false);
      setPopup({ isOpen: true, title: 'Succès', msg: 'Informations mises à jour.', type: 'success' });
    } catch (err) {
      setPopup({ isOpen: true, title: 'Erreur', msg: 'Impossible de modifier la réunion.', type: 'danger' });
    } finally {
      setSavingInfo(false);
    }
  };

  const handleUpdateAttendance = async (userId: number, status: string) => {
    if (!canManage || !userId) return;
    try {
      setAttendance((prev) => prev.map((a) => (a.id === userId ? { ...a, status } : a)));
      await apiFetch(`/api/meetings/${id}/attendance`, {
        method: 'PUT',
        body: JSON.stringify({ user_id: userId, status }),
      });
    } catch (err) {
      setPopup({ isOpen: true, title: 'Erreur', msg: 'Erreur de synchronisation.', type: 'danger' });
      fetchData();
    }
  };

  const handleSaveReport = async () => {
    setSavingReport(true);
    try {
      await apiFetch(`/api/meetings/${id}/report`, { method: 'PUT', body: JSON.stringify({ report }) });
      setMeeting({ ...meeting, report });
      setPopup({ isOpen: true, title: 'Enregistré', msg: 'Procès-verbal sauvegardé.', type: 'success' });
    } catch (err) {
      setPopup({ isOpen: true, title: 'Erreur', msg: 'Erreur de sauvegarde.', type: 'danger' });
    } finally {
      setSavingReport(false);
    }
  };

  const displayedAttendance = useMemo(() => {
    let result = attendance;
    if (quickFilter !== 'all') {
      result = result.filter((a) => a.status === quickFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((a) =>
        (a.first_name + ' ' + a.last_name + ' ' + (a.district || '') + ' ' + (a.phone || '')).toLowerCase().includes(q)
      );
    }
    return evaluateSylobRules(result, filterRules, matchMode, ATTENDANCE_FILTER_FIELDS);
  }, [attendance, quickFilter, searchTerm, filterRules, matchMode]);

  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const absentCount = attendance.filter((a) => a.status === 'absent').length;
  const totalCount = attendance.length;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const regionalStats = useMemo(() => {
    const map = new Map<string, { total: number; present: number }>();
    attendance.forEach((a) => {
      const region = a.region || a.province || 'Non défini';
      const cur = map.get(region) || { total: 0, present: 0 };
      cur.total += 1;
      if (a.status === 'present') cur.present += 1;
      map.set(region, cur);
    });
    return Array.from(map.entries()).map(([region, data]) => ({
      region,
      total: data.total,
      present: data.present,
      rate: Math.round((data.present / data.total) * 100),
    }));
  }, [attendance]);

  const exportPDF = () => {
    if (!meeting) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(20);
    doc.setTextColor(4, 120, 87);
    doc.text('Association Dévoir et Citoyen (ADC)', pageWidth / 2, 20, { align: 'center' });
    doc.setDrawColor(4, 120, 87);
    doc.setLineWidth(0.5);
    doc.line(14, 25, pageWidth - 14, 25);

    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('PROCÈS-VERBAL DE RÉUNION', pageWidth / 2, 35, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Sujet:', 14, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(meeting.title, 40, 45);
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', 14, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(meeting.date), 'dd MMMM yyyy', { locale: fr }), 40, 52);
    doc.setFont('helvetica', 'bold');
    doc.text('Heure:', 14, 59);
    doc.setFont('helvetica', 'normal');
    doc.text(meeting.time, 40, 59);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Feuille d\'émargement', 14, 70);

    const tableData = displayedAttendance.map((a, index) => [
      index + 1,
      `${a.last_name} ${a.first_name}`,
      a.phone,
      a.district || a.region || 'N/A',
      a.status === 'present' ? 'Présent(e)' : 'Absent(e)',
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['N°', 'Nom & Prénom', 'Téléphone', 'Localisation', 'Statut']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [4, 120, 87] },
      styles: { fontSize: 10 },
      didParseCell: function (data: any) {
        if (data.section === 'body' && data.column.index === 4) {
          data.cell.styles.textColor = data.cell.raw === 'Présent(e)' ? [4, 120, 87] : [220, 38, 38];
        }
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    if (meeting.report) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Compte rendu de la séance', 14, finalY);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const splitReport = doc.splitTextToSize(meeting.report, pageWidth - 28);
      doc.text(splitReport, 14, finalY + 7);
    }
    doc.save(`PV_ADC_${format(new Date(meeting.date), 'yyyy-MM-dd')}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={40} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-20 text-slate-500">
        <h3 className="text-xl font-black">Réunion introuvable</h3>
        <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-slate-800 text-white rounded-xl font-bold">
          Retour
        </button>
      </div>
    );
  }

  const getMeetingStatus = (date: string, time: string) => {
    const diff = new Date().getTime() - parseISO(`${date}T${time}`).getTime();
    if (diff > 0 && diff < 2 * 60 * 60 * 1000) return { label: 'En cours', color: 'bg-emerald-500' };
    if (diff > 2 * 60 * 60 * 1000) return { label: 'Passée', color: 'bg-slate-400' };
    return { label: 'À venir', color: 'bg-blue-500' };
  };
  const status = getMeetingStatus(meeting.date, meeting.time);

  return (
    <div className="space-y-8 pb-20 font-sans max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-white border border-slate-100 shadow-sm text-slate-600 hover:text-slate-900 rounded-2xl flex items-center justify-center transition-all cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight uppercase">
                {meeting.title}
              </h2>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase text-white tracking-widest ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-slate-400 font-bold text-xs mt-1">
              <span className="flex items-center gap-1.5"><Calendar size={13} className="text-emerald-500" /> {format(new Date(meeting.date), 'dd MMMM yyyy', { locale: fr })}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Clock size={13} className="text-emerald-500" /> {meeting.time}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {canManage && (
            <button
              onClick={() => setIsScannerOpen(true)}
              className="bg-slate-900 hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl text-xs font-black tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-slate-900/10 cursor-pointer"
            >
              <QrCode size={16} /> SCANNER LES BADGES
            </button>
          )}

          {(status.label === 'En cours' || status.label === 'À venir') && (
            <button
              onClick={() => navigate(`/meetings/${id}/room`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl text-xs font-black tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-200 animate-pulse cursor-pointer"
            >
              🎤 SALON VOCAL
            </button>
          )}

          {canManage && (
            <button
              onClick={exportPDF}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl text-xs font-black tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Download size={16} /> EXPORTER PDF ({displayedAttendance.length})
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-slate-100/80 p-1.5 rounded-[1.5rem] w-full sm:w-auto overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users size={16} /> Feuille d'appel ({presentCount}/{totalCount})
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'report'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText size={16} /> Procès-Verbal {meeting.report ? '✓' : ''}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 size={16} /> Analyse ({attendanceRate}%)
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'info'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Info size={16} /> Ordre du Jour
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-4 px-4 text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 size={15} /> {presentCount} Présents</span>
          <span>•</span>
          <span className="flex items-center gap-1.5 text-rose-500"><XCircle size={15} /> {absentCount} Absents</span>
          <span>•</span>
          <span className="bg-slate-100 px-2.5 py-1 rounded-full text-slate-700 font-extrabold">{attendanceRate}% Émargement</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'attendance' && (
          <motion.div
            key="tab-attendance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <SylobFilterBuilder
              fields={ATTENDANCE_FILTER_FIELDS}
              rules={filterRules}
              matchMode={matchMode}
              totalCount={displayedAttendance.length}
              onApply={(rules, mode) => {
                setFilterRules(rules);
                setMatchMode(mode);
              }}
            />

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/30 border border-slate-100 overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-1 rounded-2xl flex items-center">
                    <button
                      onClick={() => setQuickFilter('all')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        quickFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Tous ({totalCount})
                    </button>
                    <button
                      onClick={() => setQuickFilter('present')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        quickFilter === 'present' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Présents ({presentCount})
                    </button>
                    <button
                      onClick={() => setQuickFilter('absent')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        quickFilter === 'absent' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Absents ({absentCount})
                    </button>
                  </div>
                </div>

                <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    type="text"
                    placeholder="Recherche rapide nom, téléphone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 placeholder:text-slate-300"
                  />
                </div>
              </div>

              {displayedAttendance.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Aucun membre ne correspond aux critères sélectionnés.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white border-b border-slate-100">
                      <tr>
                        <th className="p-5 pl-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Adhérent</th>
                        <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Localisation</th>
                        <th className="p-5 pr-8 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Émargement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {displayedAttendance.map((a) => {
                        const hasPhoto = a.photo_url && a.photo_url !== 'EMPTY' && !a.photo_url.includes('EMPTY');
                        return (
                          <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-5 pl-8">
                              <div className="flex items-center gap-4">
                                {hasPhoto ? (
                                  <img 
                                    src={a.photo_url} 
                                    alt="" 
                                    className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-slate-100" 
                                    loading="lazy"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm border border-emerald-100/60 shadow-xs">
                                    {a.first_name?.[0]}{a.last_name?.[0]}
                                  </div>
                                )}
                                <div>
                                  <div className="font-extrabold text-slate-800 text-sm uppercase">{a.first_name} {a.last_name}</div>
                                  <div className="text-[11px] font-semibold text-slate-400 mt-0.5">{a.phone}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-5 text-xs font-bold text-slate-600 uppercase">
                              <div>{a.district || a.region || 'N/A'}</div>
                              {a.province && <div className="text-[10px] text-slate-400 font-medium">{a.province}</div>}
                            </td>
                            <td className="p-5 pr-8 text-right">
                              {canManage ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleUpdateAttendance(a.id, 'present')}
                                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                                      a.status === 'present'
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 scale-105'
                                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                    }`}
                                  >
                                    <Check size={14} /> Présent
                                  </button>
                                  <button
                                    onClick={() => handleUpdateAttendance(a.id, 'absent')}
                                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                                      a.status === 'absent'
                                        ? 'bg-rose-500 text-white shadow-md shadow-rose-200 scale-105'
                                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                    }`}
                                  >
                                    <X size={14} /> Absent
                                  </button>
                                </div>
                              ) : (
                                <span
                                  className={`inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                    a.status === 'present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                                  }`}
                                >
                                  {a.status === 'present' ? 'Présent' : 'Absent'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'report' && (
          <motion.div
            key="tab-report"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 sm:p-12 text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 relative z-10 border-b border-white/10 pb-6">
              <div>
                <h3 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tight">
                  <FileText className="text-emerald-400" size={24} />
                  Procès-Verbal de la Séance
                </h3>
                <p className="text-slate-400 text-xs font-semibold mt-1">
                  Rédigez les décisions clés, les résolutions adoptées et le compte rendu complet.
                </p>
              </div>

              {canManage && (
                <button
                  onClick={handleSaveReport}
                  disabled={savingReport || report === meeting.report}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-7 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  {savingReport ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Enregistrer les modifications
                </button>
              )}
            </div>

            <div className="relative z-10">
              {canManage ? (
                <textarea
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                  placeholder="Commencez la rédaction du compte rendu ici..."
                  className="w-full px-8 py-6 bg-white/5 border border-white/10 rounded-[2rem] focus:bg-white/10 outline-none resize-none min-h-[380px] text-sm leading-relaxed text-white font-medium placeholder:text-slate-500 transition-all font-sans"
                />
              ) : (
                <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-medium min-h-[200px]">
                  {meeting.report || <span className="text-slate-500 italic">Aucun compte rendu rédigé pour le moment.</span>}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="tab-analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/30 border border-slate-100 p-8 sm:p-10 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Taux de participation global</span>
              
              <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path
                    className="text-emerald-500 transition-all duration-1000 ease-out"
                    strokeDasharray={`${attendanceRate}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-slate-800">{attendanceRate}%</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">Présents</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100/60">
                  <div className="text-3xl font-black text-emerald-600">{presentCount}</div>
                  <div className="text-[10px] font-black text-emerald-700/60 uppercase tracking-widest mt-1">Présents</div>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="text-3xl font-black text-slate-800">{totalCount}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Convoqués</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/30 border border-slate-100 p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">Participation par Région</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Taux d'engagement territorial</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {regionalStats.map((item) => (
                    <div key={item.region} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-800 text-xs uppercase">{item.region}</span>
                        <span className="text-xs font-black text-slate-700">{item.present} / {item.total} ({item.rate}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                          style={{ width: `${item.rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400">
                <span>Total régions représentées : {regionalStats.length}</span>
                <span className="text-emerald-600">Données en direct</span>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'info' && (
          <motion.div
            key="tab-info"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/30 border border-slate-100 p-8 sm:p-12"
          >
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Paramètres de la réunion</h3>
                <p className="text-slate-400 text-xs font-semibold mt-1">Détails de convocation et ordre du jour</p>
              </div>
              {canManage && !isEditingInfo && (
                <button
                  onClick={() => setIsEditingInfo(true)}
                  className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-5 py-2.5 rounded-xl hover:bg-emerald-100 transition-all uppercase tracking-wider cursor-pointer"
                >
                  <Edit3 size={15} /> Modifier les informations
                </button>
              )}
            </div>

            {isEditingInfo ? (
              <form onSubmit={handleUpdateMeetingInfo} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Titre de la réunion</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Date</label>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      className="w-full mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Heure</label>
                    <input
                      type="time"
                      value={editForm.time}
                      onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                      className="w-full mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-700"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Ordre du jour / Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium outline-none min-h-[160px]"
                    required
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={savingInfo}
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex justify-center gap-2 cursor-pointer"
                  >
                    {savingInfo ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Enregistrer
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Date</span>
                    <span className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                      <Calendar size={16} className="text-emerald-500" /> {format(new Date(meeting.date), 'EEEE d MMMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Heure de convocation</span>
                    <span className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                      <Clock size={16} className="text-emerald-500" /> {meeting.time}
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="bg-slate-50/70 rounded-3xl p-8 border border-slate-100 min-h-[180px]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Ordre du jour / Description</span>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                      {meeting.description || <span className="text-slate-400 italic">Aucune description fournie pour cette réunion.</span>}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        attendance={attendance}
        onMarkPresent={async (userId) => {
          await handleUpdateAttendance(userId, 'present');
        }}
      />

      <ConfirmModal
        isOpen={popup.isOpen}
        title={popup.title}
        message={popup.msg}
        type={popup.type}
        onlyConfirm
        onCancel={() => setPopup({ ...popup, isOpen: false })}
      />
    </div>
  );
}