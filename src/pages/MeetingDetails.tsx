import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Check, X, Calendar, Clock, FileText, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';

export default function MeetingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState('');
  const [savingReport, setSavingReport] = useState(false);

  const userStr = localStorage.getItem('adc_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [meetingRes, attendanceRes] = await Promise.all([
        fetch('/api/meetings'),
        fetch(`/api/meetings/${id}/attendance`)
      ]);
      const meetingsData = await meetingRes.json();
      const currentMeeting = meetingsData.find((m: any) => m.id === Number(id));
      setMeeting(currentMeeting);
      setReport(currentMeeting?.report || '');

      const attendanceData = await attendanceRes.json();
      setAttendance(attendanceData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAttendance = async (userId: number, status: string) => {
    if (!isAdmin) return;
    try {
      await fetch(`/api/meetings/${id}/attendance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, status }),
      });
      
      // Mettre à jour l'état local pour une meilleure réactivité
      setAttendance(attendance.map(a => 
        a.user_id === userId ? { ...a, status } : a
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveReport = async () => {
    setSavingReport(true);
    try {
      await fetch(`/api/meetings/${id}/report`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report }),
      });
      setMeeting({ ...meeting, report });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingReport(false);
    }
  };

  const exportPDF = () => {
    if (!meeting) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(4, 120, 87); // emerald-700
    doc.text('Association  Dévoir et Citoyen (ADC)', pageWidth / 2, 20, { align: 'center' });
    
    doc.setDrawColor(4, 120, 87);
    doc.setLineWidth(0.5);
    doc.line(14, 25, pageWidth - 14, 25);
    
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('PROCÈS-VERBAL DE RÉUNION', pageWidth / 2, 35, { align: 'center' });
    
    // Meeting Info
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
    
    // Attendance Table
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Liste des présences', 14, 70);
    
    const tableData = attendance.map((a, index) => [
      index + 1,
      `${a.last_name} ${a.first_name}`,
      a.phone,
      a.status === 'present' ? 'Présent(e)' : 'Absent(e)'
    ]);
    
    autoTable(doc, {
      startY: 75,
      head: [['N°', 'Nom & Prénom', 'Téléphone', 'Statut']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [4, 120, 87] },
      styles: { fontSize: 10 },
      didParseCell: function(data: any) {
        if (data.section === 'body' && data.column.index === 3) {
          if (data.cell.raw === 'Présent(e)') {
            data.cell.styles.textColor = [4, 120, 87];
          } else {
            data.cell.styles.textColor = [220, 38, 38];
          }
        }
      }
    });
    
    // Report Section
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    if (meeting.report) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Compte rendu de la réunion', 14, finalY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const splitReport = doc.splitTextToSize(meeting.report, pageWidth - 28);
      doc.text(splitReport, 14, finalY + 7);
    }
    
    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      doc.text(`Document généré le ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, doc.internal.pageSize.getHeight() - 10);
    }
    
    doc.save(`PV_ADC_${format(new Date(meeting.date), 'yyyy-MM-dd')}.pdf`);
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p>Chargement des détails de la réunion...</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-20 text-slate-500 flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
          <Calendar size={32} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Réunion introuvable</h3>
          <p className="text-sm mt-1">La réunion que vous cherchez n'existe pas ou a été supprimée.</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-5 py-2.5 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
        >
          Retour
        </button>
      </div>
    );
  }

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const totalCount = attendance.length;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const getMeetingStatus = (date: string, time: string) => {
    const meetingDate = parseISO(`${date}T${time}`);
    const now = new Date();
    const diff = now.getTime() - meetingDate.getTime();
    const twoHours = 2 * 60 * 60 * 1000;

    if (diff > 0 && diff < twoHours) return { label: 'En cours', color: 'bg-emerald-500' };
    if (diff > twoHours) return { label: 'Passée', color: 'bg-slate-400' };
    return { label: 'À venir', color: 'bg-blue-500' };
  };

  const status = meeting ? getMeetingStatus(meeting.date, meeting.time) : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
            title="Retour"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight leading-tight">{meeting.title}</h2>
              {status && (
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase text-white ${status.color}`}>
                  {status.label}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-1">Détails et présences</p>
          </div>
        </div>
        
        {isAdmin && (
          <button
            onClick={exportPDF}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-sm shadow-emerald-600/20 w-full sm:w-auto justify-center"
          >
            <Download size={18} />
            <span>Exporter PDF</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FileText size={20} className="text-emerald-600" />
              Informations
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Date</h4>
                  <div className="flex items-center gap-3 text-slate-700">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                      <Calendar size={18} />
                    </div>
                    <span className="font-medium">{format(new Date(meeting.date), 'EEEE d MMMM yyyy', { locale: fr })}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Heure</h4>
                  <div className="flex items-center gap-3 text-slate-700">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                      <Clock size={18} />
                    </div>
                    <span className="font-medium">{meeting.time}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Description</h4>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-slate-700 text-sm leading-relaxed min-h-[100px]">
                  {meeting.description || <span className="text-slate-400 italic">Aucune description fournie.</span>}
                </div>
              </div>
            </div>
          </div>

          {(isAdmin || meeting.report) && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={20} className="text-emerald-600" />
                  Compte rendu de réunion
                </h3>
                {isAdmin && (
                  <button
                    onClick={handleSaveReport}
                    disabled={savingReport || report === meeting.report}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50"
                  >
                    {savingReport ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                )}
              </div>
              
              {isAdmin ? (
                <textarea
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                  placeholder="Décrivez ici les sujets discutés, les décisions prises et les actions à faire..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none min-h-[200px] text-sm leading-relaxed"
                />
              ) : (
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {meeting.report || <span className="text-slate-400 italic">Aucun compte rendu n'a encore été rédigé pour cette réunion.</span>}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Users size={20} className="text-emerald-600" />
              Statistiques
            </h3>
            
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500 transition-all duration-1000 ease-out"
                    strokeDasharray={`${attendanceRate}, 100`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-emerald-600">
                  <span className="text-3xl font-bold">{attendanceRate}%</span>
                </div>
              </div>
              
              <div className="w-full grid grid-cols-2 gap-4 mt-2">
                <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                  <div className="text-2xl font-bold text-emerald-700">{presentCount}</div>
                  <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider mt-1">Présents</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
                  <div className="text-2xl font-bold text-slate-700">{totalCount}</div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Total</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Liste des présences</h3>
            <p className="text-sm text-slate-500 mt-1">Gérez la présence des membres à cette réunion</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-sm font-medium text-slate-700">{presentCount} présents</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4 pl-6">Membre</th>
                <th className="p-4">Contact</th>
                <th className="p-4 pr-6 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {attendance.map((a) => (
                  <motion.tr 
                    key={a.user_id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        {a.photo_url ? (
                          <img src={a.photo_url} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
                            {a.first_name[0]}{a.last_name[0]}
                          </div>
                        )}
                        <div className="font-semibold text-slate-800">{a.first_name} {a.last_name}</div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-medium">
                      {a.phone}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdateAttendance(a.user_id, 'present')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                              a.status === 'present' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' 
                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                            }`}
                          >
                            <Check size={16} className={a.status === 'present' ? 'text-emerald-600' : 'text-slate-400'} />
                            Présent
                          </button>
                          <button
                            onClick={() => handleUpdateAttendance(a.user_id, 'absent')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                              a.status === 'absent' 
                                ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm' 
                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                            }`}
                          >
                            <X size={16} className={a.status === 'absent' ? 'text-red-600' : 'text-slate-400'} />
                            Absent
                          </button>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          a.status === 'present' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' 
                            : 'bg-red-50 text-red-700 border border-red-200/50'
                        }`}>
                          {a.status === 'present' ? 'Présent' : 'Absent'}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {attendance.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users size={40} className="text-slate-300 mb-3" />
                      <p>Aucun membre inscrit pour cette réunion.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
