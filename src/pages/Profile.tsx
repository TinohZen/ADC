import React, { useState } from 'react';
import { User, Lock, Camera, Save, Key, MapPin, Loader2, Phone, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../lib/apiFetch';
import ConfirmModal from '../components/ConfirmModal';

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
  const [formData, setFormData] = useState({ ...initialUser, province: initialUser.province || 'Antananarivo', region: initialUser.region || 'Analamanga', district: initialUser.district || 'Antananarivo-Renivohitra' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [popup, setPopup] = useState({ isOpen: false, title: '', msg: '', type: 'success' as any });

  const handleUpdate = async (e: any) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await apiFetch(`/api/users/${initialUser.id}`, { method: 'PUT', body: JSON.stringify(formData) });
      const data = await res.json();
      localStorage.setItem('adc_user', JSON.stringify({ ...formData, photo_url: data.photo_url }));
      setPopup({ isOpen: true, title: 'Succès', msg: 'Profil mis à jour !', type: 'success' });
    } finally { setLoading(false); }
  };

  const handlePass = async (e: any) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return setPopup({ isOpen: true, title: 'Erreur', msg: 'Les mots de passe ne correspondent pas.', type: 'danger' });
    setPassLoading(true);
    try {
      await apiFetch(`/api/users/${initialUser.id}/password`, { method: 'PUT', body: JSON.stringify(passwords) });
      setPopup({ isOpen: true, title: 'Sécurisé', msg: 'Mot de passe modifié.', type: 'success' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } finally { setPassLoading(false); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
          <form onSubmit={handleUpdate} className="space-y-10">
            <div className="flex justify-center">
              <label className="relative cursor-pointer group"><img src={formData.photo_url} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white shadow-2xl group-hover:scale-105 transition-all" /><input type="file" className="hidden" accept="image/*" onChange={(e:any)=>{ const r = new FileReader(); r.onloadend=()=>setFormData({...formData, photo_url: r.result as string}); r.readAsDataURL(e.target.files[0]); }} /></label>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <ProfileInp label="Prénom" val={formData.first_name} set={(v:any)=>setFormData({...formData, first_name:v})} />
              <ProfileInp label="Nom" val={formData.last_name} set={(v:any)=>setFormData({...formData, last_name:v})} />
            </div>
            <div className="bg-slate-50 p-8 rounded-[2.5rem] grid md:grid-cols-3 gap-4">
              <ProfileSel label="Province" val={formData.province} opts={Object.keys(MADAGASCAR_DATA)} set={(v:any)=>{ const r = Object.keys(MADAGASCAR_DATA[v])[0]; setFormData({...formData, province:v, region:r, district:MADAGASCAR_DATA[v][r][0]})}} />
              <ProfileSel label="Région" val={formData.region} opts={Object.keys(MADAGASCAR_DATA[formData.province]||{})} set={(v:any)=>setFormData({...formData, region:v, district:MADAGASCAR_DATA[formData.province][v][0]})} />
              <ProfileSel label="District" val={formData.district} opts={MADAGASCAR_DATA[formData.province][formData.region]||[]} set={(v:any)=>setFormData({...formData, district:v})} />
            </div>
            <button className="w-full bg-emerald-600 text-white p-5 rounded-2xl font-black text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 disabled:opacity-50">{loading && <Loader2 className="animate-spin" size={20}/>} ENREGISTRER</button>
          </form>
        </div>
        <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl space-y-8">
            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3"><Key size={24} className="text-emerald-400"/> Sécurité</h3>
            <form onSubmit={handlePass} className="space-y-5">
                <DarkInp label="Actuel" val={passwords.currentPassword} set={(v:any)=>setPasswords({...passwords, currentPassword:v})} />
                <DarkInp label="Nouveau" val={passwords.newPassword} set={(v:any)=>setPasswords({...passwords, newPassword:v})} />
                <DarkInp label="Confirmer" val={passwords.confirmPassword} set={(v:any)=>setPasswords({...passwords, confirmPassword:v})} />
                <button className="w-full bg-white text-slate-900 p-5 rounded-2xl font-black text-[10px] tracking-widest shadow-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2">{passLoading && <Loader2 className="animate-spin" size={16}/>} MODIFIER</button>
            </form>
        </div>
      </div>
      <ConfirmModal isOpen={popup.isOpen} title={popup.title} message={popup.msg} type={popup.type} onlyConfirm onCancel={()=>setPopup({...popup, isOpen:false})} />
    </div>
  );
}
const ProfileInp = ({ label, val, set }: any) => (
    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{label}</label><input type="text" value={val} onChange={(e)=>set(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-emerald-500" /></div>
);
const ProfileSel = ({ label, val, opts, set }: any) => (
    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">{label}</label><select value={val} onChange={(e)=>set(e.target.value)} className="w-full p-3 bg-white rounded-xl font-bold text-xs outline-none">{opts.map((o:any)=><option key={o} value={o}>{o}</option>)}</select></div>
);
const DarkInp = ({ label, val, set }: any) => (
    <div className="space-y-1"><label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-2">{label}</label><input type="password" value={val} onChange={(e)=>set(e.target.value)} className="w-full p-4 bg-white/5 rounded-2xl text-white outline-none border border-white/10 focus:border-emerald-500 transition-all" /></div>
);