import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'motion/react';

export default function MemberDashboard() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/meetings');
      const data = await res.json();
      setMeetings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Mes Réunions</h2>
        <p className="text-slate-500 text-sm mt-1">Consultez les prochaines réunions de l'association</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p>Chargement des réunions...</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {meetings.map((meeting) => (
            <motion.div 
              key={meeting.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-all hover:border-emerald-200 group"
            >
              <h3 className="font-bold text-lg text-slate-800 mb-3 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors">{meeting.title}</h3>
              <p className="text-slate-500 text-sm mb-5 flex-1 line-clamp-3 leading-relaxed">
                {meeting.description || 'Aucune description fournie.'}
              </p>
              
              <div className="flex flex-col gap-2.5 mt-auto pt-4 border-t border-slate-100">
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
            </motion.div>
          ))}
          {meetings.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-500 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
              <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-600">Aucune réunion planifiée</p>
              <p className="text-sm mt-1">Vous serez notifié lorsqu'une nouvelle réunion sera créée.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
