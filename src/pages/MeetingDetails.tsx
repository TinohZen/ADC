import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Check, X, Calendar, Clock, FileText, Users, Edit3, Save, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../lib/apiFetch';
import ConfirmModal from '../components/ConfirmModal';

export default function MeetingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<any>(null);
  const[attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États pour l'édition de la réunion (Description, Date, Heure)
  const[isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', date: '', time: '' });
  const [savingInfo, setSavingInfo] = useState(false);

  // États pour le compte rendu (Report)
  const [report, setReport] = useState('');
  const[savingReport, setSavingReport] = useState(false);
  const [popup, setPopup] = useState({ isOpen: false, title: '', msg: '', type: 'success' as any });

  const userStr = localStorage.getItem('adc_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'admin';

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [meetingRes, attendanceRes] = await Promise.all([
        apiFetch('/api/meetings'),
        apiFetch(`/api/meetings/${id}/attendance`)
      ]);
      const meetingsData = await meetingRes.json();
      const currentMeeting = meetingsData.find((m: any) => m.id === Number(id));
      
      setMeeting(currentMeeting);
      setEditForm({
        title: currentMeeting?.title || '',
        description: currentMeeting?.description || '',
        date: currentMeeting?.date || '',
        time: currentMeeting?.time || ''
      });
      setReport(currentMeeting?.report || '');

      const attendanceData = await attendanceRes.json();
      setAttendance(attendanceData);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleUpdateMeetingInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSavingInfo(true);
    try {
      await apiFetch(`/api/meetings/${id}`, { method: 'PUT', body: JSON.stringify(editForm) });
      setMeeting({ ...meeting, ...editForm });
      setIsEditingInfo(false);
      setPopup({ isOpen: true, title: 'Succès', msg: 'Les informations de la réunion ont été mises à jour.', type: 'success' });
    } catch (err) {
      setPopup({ isOpen: true, title: 'Erreur', msg: 'Impossible de modifier la réunion.', type: 'danger' });
    } finally { setSavingInfo(false); }
  };

  const handleUpdateAttendance = async (userId: number, status: string) => {
    if (!isAdmin) return;
    try {
      await apiFetch(`/api/meetings/${id}/attendance`, { method: 'PUT', body: JSON.stringify({ user_id: userId, status }) });
      setAttendance(attendance.map(a => a.user_id === userId ? { ...a, status } : a));
    } catch (err) { console.error(err); }
  };

  const handleSaveReport = async () => {
    setSavingReport(true);
    try {
      await apiFetch(`/api/meetings/${id}/report`, { method: 'PUT', body: JSON.stringify({ report }) });
      setMeeting({ ...meeting, report });
      setPopup({ isOpen: true, title: 'Enregistré', msg: 'Le compte rendu a été sauvegardé.', type: 'success' });
    } catch (err) {
      setPopup({ isOpen: true, title: 'Erreur', msg: 'Erreur lors de la sauvegarde.', type: 'danger' });
    } finally { setSavingReport(false); }
  };

  const exportPDF = () => {
    if (!meeting) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(20); doc.setTextColor(4, 120, 87);
    doc.text('Association Dévoir et Citoyen (ADC)', pageWidth / 2, 20, { align: 'center' });
    doc.setDrawColor(4, 120, 87); doc.setLineWidth(0.5); doc.line(14, 25, pageWidth - 14, 25);
    
    doc.setFontSize(16); doc.setTextColor(30, 41, 59);
    doc.text('PROCÈS-VERBAL DE RÉUNION', pageWidth / 2, 35, { align: 'center' });
    
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.text('Sujet:', 14, 45);
    doc.setFont('helvetica', 'normal'); doc.text(meeting.title, 40, 45);
    doc.setFont('helvetica', 'bold'); doc.text('Date:', 14, 52);
    doc.setFont('helvetica', 'normal'); doc.text(format(new Date(meeting.date), 'dd MMMM yyyy', { locale: fr }), 40, 52);
    doc.setFont('helvetica', 'bold'); doc.text('Heure:', 14, 59);
    doc.setFont('helvetica', 'normal'); doc.text(meeting.time, 40, 59);
    
    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text('1. Liste des présences', 14, 70);
    
    const tableData = attendance.map((a, index) =>[index + 1, `${a.last_name} ${a.first_name}`, a.phone, a.status === 'present' ? 'Présent(e)' : 'Absent(e)']);
    
    autoTable(doc, {
      startY: 75, head: [['N°', 'Nom & Prénom', 'Téléphone', 'Statut']], body: tableData,
      theme: 'grid', headStyles: { fillColor: [4, 120, 87] }, styles: { fontSize: 10 },
      didParseCell: function(data: any) {
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.textColor = data.cell.raw === 'Présent(e)' ?[4, 120, 87] : [220, 38, 38];
        }
      }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    if (meeting.report) {
      doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text('2. Compte rendu de la réunion', 14, finalY);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      const splitReport = doc.splitTextToSize(meeting.report, pageWidth - 28);
      doc.text(splitReport, 14, finalY + 7);
    }
    doc.save(`PV_ADC_${format(new Date(meeting.date), 'yyyy-MM-dd')}.pdf`);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-emerald-500"/></div>;
  if (!meeting) return <div className="text-center py-20 text-slate-500"><h3 className="text-xl font-black">Réunion introuvable</h3><button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-slate-800 text-white rounded-xl font-bold">Retour</button></div>;

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const totalCount = attendance.length;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const getMeetingStatus = (date: string, time: string) => {
    const diff = new Date().getTime() - parseISO(`${date}T${time}`).getTime();
    if (diff > 0 && diff < 2 * 60 * 60 * 1000) return { label: 'En cours', color: 'bg-emerald-500' };
    if (diff > 2 * 60 * 60 * 1000) return { label: 'Passée', color: 'bg-slate-400' };
    return { label: 'À venir', color: 'bg-blue-500' };
  };
  const status = getMeetingStatus(meeting.date, meeting.time);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all shadow-sm"><ArrowLeft size={20} /></button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight uppercase">{meeting.title}</h2>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase text-white tracking-widest ${status.color}`}>{status.label}</span>
            </div>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Détails et présences</p>
          </div>
        </div>
        
        {isAdmin && (
          <button onClick={exportPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl text-xs font-black tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-emerald-200 w-full sm:w-auto justify-center">
            <Download size={18} /> EXPORTER PDF
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLONNE GAUCHE : INFOS ET COMPTE RENDU */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* CARTE D'INFORMATIONS */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8 sm:p-10">
            <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><FileText size={20}/></div>
                Informations
              </h3>
              {isAdmin && !isEditingInfo && (
                <button onClick={() => setIsEditingInfo(true)} className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-all uppercase tracking-widest">
                    <Edit3 size={14}/> Modifier
                </button>
              )}
            </div>
            
            {isEditingInfo ? (
              <form onSubmit={handleUpdateMeetingInfo} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Titre de la réunion</label>
                    <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-emerald-500" required />
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Date</label>
                      <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-emerald-500" required />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Heure</label>
                      <input type="time" value={editForm.time} onChange={e => setEditForm({...editForm, time: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-emerald-500" required />
                  </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Description / Ordre du jour</label>
                    <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-medium border-none outline-none focus:ring-2 focus:ring-emerald-500 min-h-[150px]" required />
                </div>
                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsEditingInfo(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200">Annuler</button>
                    <button type="submit" disabled={savingInfo} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex justify-center gap-2">
                        {savingInfo ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Enregistrer
                    </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="sm:col-span-1 space-y-6">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Date</h4>
                    <div className="flex items-center gap-3 text-slate-800 font-bold"><Calendar size={18} className="text-emerald-500"/> {format(new Date(meeting.date), 'EEEE d MMMM yyyy', { locale: fr })}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Heure</h4>
                    <div className="flex items-center gap-3 text-slate-800 font-bold"><Clock size={18} className="text-emerald-500"/> {meeting.time}</div>
                  </div>
                </div>
                
                {/* LA DESCRIPTION AVEC MISE EN FORME RICHE (sauts de ligne respectés) */}
                <div className="sm:col-span-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-2">Description</h4>
                  <div className="bg-emerald-50/50 rounded-[2rem] p-6 border-l-4 border-emerald-500 text-slate-700 text-sm leading-relaxed min-h-[150px] font-medium whitespace-pre-wrap shadow-inner">
                    {meeting.description || <span className="text-slate-400 italic">Aucune description fournie.</span>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* COMPTE RENDU */}
          {(isAdmin || meeting.report) && (
            <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter">
                  <div className="p-2 bg-white/10 text-emerald-400 rounded-xl"><FileText size={20}/></div>
                  Compte Rendu
                </h3>
                {isAdmin && (
                  <button onClick={handleSaveReport} disabled={savingReport || report === meeting.report} className="text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg">
                    {savingReport ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Enregistrer
                  </button>
                )}
              </div>
              
              <div className="relative z-10">
                  {isAdmin ? (
                    <textarea value={report} onChange={(e) => setReport(e.target.value)} placeholder="Rédigez le compte rendu ici. Les sauts de ligne seront respectés..." className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-[2rem] focus:bg-white/10 outline-none resize-none min-h-[250px] text-sm leading-relaxed text-white font-medium whitespace-pre-wrap placeholder:text-slate-500 transition-all" />
                  ) : (
                    <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                      {meeting.report || <span className="text-slate-500 italic">Aucun compte rendu rédigé pour le moment.</span>}
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* COLONNE DROITE : STATISTIQUES */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8">
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-tighter">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Users size={20}/></div>
              Statistiques
            </h3>
            
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-40 h-40 flex items-center justify-center mb-8">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-50" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-emerald-500 transition-all duration-1000 ease-out" strokeDasharray={`${attendanceRate}, 100`} strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-slate-800">{attendanceRate}%</span>
                </div>
              </div>
              
              <div className="w-full grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-[1.5rem] p-4 text-center border border-emerald-100">
                  <div className="text-3xl font-black text-emerald-600 mb-1">{presentCount}</div>
                  <div className="text-[10px] font-black text-emerald-700/60 uppercase tracking-widest">Présents</div>
                </div>
                <div className="bg-slate-50 rounded-[1.5rem] p-4 text-center border border-slate-100">
                  <div className="text-3xl font-black text-slate-800 mb-1">{totalCount}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LISTE DES PRÉSENCES */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Liste des présences</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Membres convoqués</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span>
            <span className="text-xs font-bold text-slate-700">{presentCount} présents</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white">
              <tr>
                <th className="p-5 pl-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Membre</th>
                <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Localisation</th>
                <th className="p-5 pr-8 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {attendance.map((a) => (
                  <motion.tr key={a.user_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 pl-8">
                      <div className="flex items-center gap-4">
                        {a.photo_url ? (
                          <img src={a.photo_url} className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-slate-100" />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg border border-white shadow-sm">{a.first_name[0]}{a.last_name[0]}</div>
                        )}
                        <div>
                            <div className="font-bold text-slate-800 text-sm uppercase">{a.first_name} {a.last_name}</div>
                            <div className="text-[10px] font-bold text-slate-400 mt-0.5">{a.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-xs font-bold text-slate-700">
                      {a.district || a.region}
                    </td>
                    <td className="p-5 pr-8 text-right">
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleUpdateAttendance(a.user_id, 'present')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${a.status === 'present' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                            <Check size={14} /> Présent
                          </button>
                          <button onClick={() => handleUpdateAttendance(a.user_id, 'absent')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${a.status === 'absent' ? 'bg-red-500 text-white shadow-md shadow-red-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                            <X size={14} /> Absent
                          </button>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${a.status === 'present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                          {a.status === 'present' ? 'Présent' : 'Absent'}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal isOpen={popup.isOpen} title={popup.title} message={popup.msg} type={popup.type} onlyConfirm onCancel={() => setPopup({ ...popup, isOpen: false })} />
    </motion.div>
  );
}