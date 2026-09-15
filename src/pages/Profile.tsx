import React, { useState } from 'react';
import { User, Lock, Camera, Save, Key, MapPin, Loader2, Phone, Mail, CreditCard, Printer } from 'lucide-react';
import { apiFetch } from '../lib/apiFetch';
import ConfirmModal from '../components/ConfirmModal';
import MemberBadge from '../components/badges/MemberBadge';

const MADAGASCAR_DATA: any = {
  "Antananarivo": { "Analamanga": ["Ambohidratrimo", "Andramasina", "Anjozorobe", "Ankazobe", "Antananarivo-Atsimondrano", "Antananarivo-Avaradrano", "Antananarivo-Renivohitra", "Manjakandriana"], "Bongolava": ["Fenoarivobe", "Tsiroanomandidy"], "Itasy": ["Arivonimamo", "Miarinarivo", "Soavinandriana"], "Vakinankaratra": ["Ambatolampy", "Antanifotsy", "Antsirabe I", "Antsirabe II", "Betafo", "Faratsiho", "Mandoto"] },
  "Antsiranana": { "Diana": ["Ambanja", "Ambilobe", "Antsiranana I", "Antsiranana II", "Nosy Be"], "Sava": ["Andapa", "Antalaha", "Sambava", "Vohemar"] },
  "Fianarantsoa": { "Amoron'i Mania": ["Ambatofinandrahana", "Ambositra", "Fandriana", "Manandriana"], "Haute Matsiatra": ["Ambalavao", "Ambohimahasoa", "Fianarantsoa I", "Ikalamavony", "Isandra", "Lalangina", "Vohibato"], "Vatovavy": ["Ifanadiana", "Mananjary", "Nosy Varika"], "Fitovinany": ["Ikongo", "Manakara", "Vohipeno"], "Atsimo-Atsinanana": ["Befotaka", "Farafangana", "Midongy Sud", "Vangaindrano", "Vondrozo"], "Ihorombe": ["Iakora", "Ihosy", "Ivohibe"] },
  "Mahajanga": { "Boeny": ["Ambato-Boeny", "Mahajanga I", "Mahajanga II", "Marovoay", "Mitsinjo"], "Betsiboka": ["Kandreho", "Maevatanana", "Tsaratanana"], "Melaky": ["Ambatomainty", "Antsalova", "Besalampy", "Maintirano", "Morafenobe"], "Sofia": ["Analalava", "Antsohihy", "Bealanana", "Befandriana Nord", "Mampikony", "Mandritsara", "Port-Bergé"] },
  "Toamasina": { "Alaotra-Mangoro": ["Ambatondrazaka", "Amparafaravola", "Andilamena", "Anosibe An'ala", "Moramanga"], "Atsinanana": ["Antanambao-Manampotsy", "Brickaville", "Mahanoro", "Marolambo", "Toamasina I", "Toamasina II", "Vatomandry"], "Analanjirofo": ["Fenoarivo Atsinanana", "Mananara Avaratra", "Maroantsetra", "Sainte Marie", "Soanierana Ivongo", "Vavatenina"] },
  "Toliara": { "Menabe": ["Belo sur Tsiribihina", "Mahabo", "Manja", "Morondava"], "Atsimo-Andrefana": ["Ampanihy Ouest", "Ankazoabo", "Betioky Sud", "Morombe", "Sakaraha", "Toliara I", "Toliara II"], "Androy": ["Ambovombe-Androy", "Bekily", "Beloha", "Tsihombe"], "Anosy": ["Amboasary Sud", "Betroka", "Taolagnaro"] }
};

export default function Profile() {
  const userStr = localStorage.getItem('adc_user');
  const initialUser = userStr ? JSON.parse(userStr) : null;
  const [activeTab, setActiveTab] = useState<'profile' | 'badge'>('profile');

  const [formData, setFormData] = useState({ 
    ...initialUser, 
    province: initialUser?.province || 'Antananarivo', 
    region: initialUser?.region || 'Analamanga', 
    district: initialUser?.district || 'Antananarivo-Renivohitra' 
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [popup, setPopup] = useState({ isOpen: false, title: '', msg: '', type: 'success' as any });

  const handleUpdate = async (e: any) => {
    e.preventDefault(); 
    setLoading(true);
    try {
      const res = await apiFetch(`/api/users/${initialUser.id}`, { method: 'PUT', body: JSON.stringify(formData) });
      const data = await res.json();
      localStorage.setItem('adc_user', JSON.stringify({ ...formData, photo_url: data.photo_url }));
      setPopup({ isOpen: true, title: 'Succès', msg: 'Votre profil a été mis à jour avec succès.', type: 'success' });
    } catch { 
      setPopup({ isOpen: true, title: 'Erreur', msg: 'Erreur lors de la mise à jour.', type: 'danger' }); 
    } finally { 
      setLoading(false); 
    }
  };

  const handlePass = async (e: any) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setPopup({ isOpen: true, title: 'Attention', msg: 'Les mots de passe ne correspondent pas.', type: 'danger' });
    }
    setPassLoading(true);
    try {
      const res = await apiFetch(`/api/users/${initialUser.id}/password`, { method: 'PUT', body: JSON.stringify(passwords) });
      if (!res.ok) throw new Error();
      setPopup({ isOpen: true, title: 'Sécurisé', msg: 'Mot de passe modifié avec succès.', type: 'success' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch { 
      setPopup({ isOpen: true, title: 'Erreur', msg: 'Mot de passe actuel incorrect.', type: 'danger' }); 
    } finally { 
      setPassLoading(false); 
    }
  };

  const handlePrintBadge = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 font-sans">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #single-badge-print, #single-badge-print * {
            visibility: visible !important;
          }
          #single-badge-print {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 85mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          @page {
            size: portrait;
            margin: 0;
          }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight uppercase">Mon Espace</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-0.5">Paramètres et Accréditation</p>
        </div>

        <div className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'profile' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Informations
          </button>
          <button
            onClick={() => setActiveTab('badge')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'badge' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <CreditCard size={14} /> Ma Carte Officielle
          </button>
        </div>
      </div>

      {activeTab === 'badge' ? (
        <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="mb-6 print:hidden">
            <h3 className="text-xl font-black text-slate-800 uppercase">Votre Badge Membre</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">Valable pour toutes les réunions officielles et assemblées de l'ADC</p>
          </div>

          <div id="single-badge-print">
            <MemberBadge 
              user={formData} 
              activityName="Carte d'Adhérent Officielle"
              onPrintSingle={handlePrintBadge}
            />
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8 print:hidden">
          <div className="lg:col-span-2 bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
            <form onSubmit={handleUpdate} className="space-y-8">
              <div className="flex justify-center">
                <label className="relative cursor-pointer group">
                  {formData.photo_url && formData.photo_url !== 'EMPTY' ? (
                    <img src={formData.photo_url} className="w-28 h-28 rounded-3xl object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-all" />
                  ) : (
                    <div className="w-28 h-28 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-2xl border-4 border-white shadow-xl">
                      {formData.first_name?.[0]}{formData.last_name?.[0]}
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-emerald-600 p-2.5 rounded-2xl text-white shadow-md"><Camera size={18}/></div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e:any)=>{ const r = new FileReader(); r.onloadend=()=>setFormData({...formData, photo_url: r.result as string}); if(e.target.files[0]) r.readAsDataURL(e.target.files[0]); }} />
                </label>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <ProfileInp label="Prénom" val={formData.first_name} set={(v:any)=>setFormData({...formData, first_name:v})} />
                <ProfileInp label="Nom" val={formData.last_name} set={(v:any)=>setFormData({...formData, last_name:v})} />
                <ProfileInp label="Téléphone" val={formData.phone} set={(v:any)=>setFormData({...formData, phone:v})} />
                <ProfileInp label="Email" val={formData.email} set={(v:any)=>setFormData({...formData, email:v})} />
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={13} className="text-emerald-500"/> Localisation Madagascar</p>
                <div className="grid md:grid-cols-3 gap-3">
                  <ProfileSel label="Province" val={formData.province} opts={Object.keys(MADAGASCAR_DATA)} set={(v:any)=>{ const r = Object.keys(MADAGASCAR_DATA[v])[0]; setFormData({...formData, province:v, region:r, district:MADAGASCAR_DATA[v][r][0]})}} />
                  <ProfileSel label="Région" val={formData.region} opts={Object.keys(MADAGASCAR_DATA[formData.province]||{})} set={(v:any)=>setFormData({...formData, region:v, district:MADAGASCAR_DATA[formData.province][v][0]})} />
                  <ProfileSel label="District" val={formData.district} opts={MADAGASCAR_DATA[formData.province]?.[formData.region] || []} set={(v:any)=>setFormData({...formData, district:v})} />
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <ProfileInp label="Commune" val={formData.commune} set={(v:any)=>setFormData({...formData, commune:v})} />
                  <ProfileInp label="Fokontany" val={formData.fokontany} set={(v:any)=>setFormData({...formData, fokontany:v})} />
                </div>
              </div>

              <button disabled={loading} className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-black text-xs tracking-wider shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:bg-emerald-700 cursor-pointer">
                {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} ENREGISTRER LES MODIFICATIONS
              </button>
            </form>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl space-y-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2.5 mb-6"><Key size={20} className="text-emerald-400"/> Sécurité</h3>
              <form onSubmit={handlePass} className="space-y-4">
                <DarkInp label="Mot de passe actuel" val={passwords.currentPassword} set={(v:any)=>setPasswords({...passwords, currentPassword:v})} />
                <DarkInp label="Nouveau mot de passe" val={passwords.newPassword} set={(v:any)=>setPasswords({...passwords, newPassword:v})} />
                <DarkInp label="Confirmer le mot de passe" val={passwords.confirmPassword} set={(v:any)=>setPasswords({...passwords, confirmPassword:v})} />
                <button disabled={passLoading} className="w-full bg-white text-slate-900 p-4 rounded-xl font-black text-[10px] tracking-widest shadow-md hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4">
                  {passLoading && <Loader2 className="animate-spin" size={15}/>} MODIFIER MON MOT DE PASSE
                </button>
              </form>
            </div>

            <div className="pt-6 border-t border-white/10 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Statut du compte</span>
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider mt-1 block">
                {formData.role} • {formData.status === 'approved' ? 'Compte Actif' : 'En attente'}
              </span>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={popup.isOpen} title={popup.title} message={popup.msg} type={popup.type} onlyConfirm onCancel={()=>setPopup({...popup, isOpen:false})} />
    </div>
  );
}

const ProfileInp = ({ label, val, set }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{label}</label>
    <input type="text" value={val || ''} onChange={(e)=>set(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 outline-none focus:bg-white focus:border-emerald-500 transition-all" />
  </div>
);

const ProfileSel = ({ label, val, opts, set }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">{label}</label>
    <select value={val || ''} onChange={(e)=>set(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:bg-white cursor-pointer">
      {opts.map((o:any)=><option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const DarkInp = ({ label, val, set }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] font-black text-white/40 uppercase tracking-wider ml-1">{label}</label>
    <input type="password" value={val} onChange={(e)=>set(e.target.value)} className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-bold outline-none focus:border-emerald-500 transition-all" />
  </div>
);