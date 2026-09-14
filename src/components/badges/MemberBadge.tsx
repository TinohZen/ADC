import React from 'react';
import { Printer, ShieldCheck, MapPin, Phone } from 'lucide-react';

interface MemberBadgeProps {
  user: any;
  activityName?: string;
  onPrintSingle?: (user: any) => void;
}

export default function MemberBadge({ user, activityName = "Carte d'Adhérent Officielle", onPrintSingle }: MemberBadgeProps) {
  const matricule = `ADC-${user.province ? user.province.substring(0, 3).toUpperCase() : 'MG'}-${String(user.id).padStart(4, '0')}`;
  
  const roleFr = {
    admin: 'ADMINISTRATEUR',
    chef: 'CHEF DE FIL',
    member: 'MEMBRE',
  }[user.role as string] || 'MEMBRE';

  const qrData = `ADC-USER-${user.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(qrData)}&color=047857`;

  return (
    <div className="flex flex-col items-center group font-sans">
      <div 
        id={`badge-${user.id}`}
        className="w-[300px] h-[470px] bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden relative flex flex-col justify-between p-6 select-none transition-transform duration-300 hover:scale-[1.02] print:shadow-none print:border-slate-300 print:rounded-2xl print:m-2 print:break-inside-avoid"
        style={{
          backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(16, 185, 129, 0.08) 0%, transparent 45%), radial-gradient(circle at 0% 100%, rgba(15, 23, 42, 0.04) 0%, transparent 50%)'
        }}
      >
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-2 bg-slate-100 rounded-full border border-slate-200/80 print:border-slate-400"></div>

        <div className="pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <img 
                src="/logoADC.png" 
                alt="Logo ADC" 
                className="w-10 h-10 object-contain shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = document.getElementById(`logo-fallback-${user.id}`);
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div id={`logo-fallback-${user.id}`} className="hidden w-10 h-10 bg-emerald-700 text-white rounded-xl items-center justify-center font-black text-xs">
                ADC
              </div>
              <div className="leading-tight">
                <h4 className="font-extrabold text-[11px] text-slate-800 tracking-tight uppercase">Association Devoir & Citoyen</h4>
                <p className="text-[8px] font-bold tracking-widest text-emerald-600 uppercase">République de Madagascar</p>
              </div>
            </div>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={14} />
            </div>
          </div>

          <div className="mt-3 text-center">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-xs">
              {activityName}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center my-auto py-2 text-center">
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-3xl p-1 bg-gradient-to-tr from-emerald-600 via-emerald-400 to-slate-200 shadow-lg shadow-emerald-700/10">
              {user.photo_url && user.photo_url !== 'EMPTY' ? (
                <img 
                  src={user.photo_url} 
                  alt="" 
                  className="w-full h-full object-cover rounded-[1.4rem] bg-white" 
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full rounded-[1.4rem] bg-slate-100 flex items-center justify-center text-slate-700 font-black text-xl">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
              )}
            </div>
            <span className={`absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[8px] font-black tracking-wider uppercase shadow-xs border ${
              user.role === 'admin' ? 'bg-rose-500 text-white border-rose-600' :
              user.role === 'chef' ? 'bg-amber-500 text-white border-amber-600' :
              'bg-emerald-600 text-white border-emerald-700'
            }`}>
              {roleFr}
            </span>
          </div>

          <h3 className="text-base font-black text-slate-800 uppercase tracking-tight line-clamp-1">
            {user.first_name} {user.last_name}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            MATRICULE : <span className="font-mono text-slate-700 font-extrabold">{matricule}</span>
          </p>
        </div>

        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/80 flex items-center justify-between gap-2">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600">
              <MapPin size={10} className="text-emerald-600 shrink-0" />
              <span className="truncate max-w-[140px] uppercase">{user.district || user.region || user.province || 'National'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600">
              <Phone size={10} className="text-emerald-600 shrink-0" />
              <span className="font-mono">{user.phone}</span>
            </div>
            <div className="text-[8px] font-black text-emerald-700 uppercase tracking-wider pt-0.5">
              Statut : {user.status === 'approved' ? 'Membre Validé' : 'En Attente'}
            </div>
          </div>

          <div className="w-13 h-13 p-1 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0">
            <img src={qrUrl} alt="Contrôle QR" className="w-full h-full object-contain" crossOrigin="anonymous" />
          </div>
        </div>

        <div className="mt-2 text-center border-t border-slate-100 pt-1.5">
          <p className="text-[7px] font-black text-slate-400 tracking-[0.2em] uppercase">
            ADC • CARTE OFFICIELLE • VALIDITÉ 2026-2027
          </p>
        </div>
      </div>

      <div className="mt-3 print:hidden">
        <button
          onClick={() => onPrintSingle && onPrintSingle(user)}
          className="px-4 py-2 bg-slate-900 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer"
        >
          <Printer size={13} /> Imprimer ce badge
        </button>
      </div>
    </div>
  );
}