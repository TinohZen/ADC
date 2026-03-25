import React, { useState } from 'react';
import { User, Lock, Camera, Save, Key, MapPin, Mail, Phone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../lib/apiFetch';

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

  // États du formulaire
  const [formData, setFormData] = useState({
    first_name: initialUser?.first_name || '', last_name: initialUser?.last_name || '',
    phone: initialUser?.phone || '', email: initialUser?.email || '', photo_url: initialUser?.photo_url || '',
    province: initialUser?.province || 'Antananarivo', region: initialUser?.region || 'Analamanga',
    district: initialUser?.district || 'Antananarivo-Renivohitra', commune: initialUser?.commune || '', fokontany: initialUser?.fokontany || ''
  });

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  // États de chargement et messages
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false); // <--- ÉTAIT MANQUANT
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleProvinceChange = (e: any) => {
    const p = e.target.value;
    const regions = Object.keys(MADAGASCAR_DATA[p] || {});
    const r = regions[0] || "";
    const d = (MADAGASCAR_DATA[p]?.[r] || [])[0] || "";
    setFormData({...formData, province: p, region: r, district: d});
  };

  const handleRegionChange = (e: any) => {
    const r = e.target.value;
    const d = (MADAGASCAR_DATA[formData.province]?.[r] || [])[0] || "";
    setFormData({...formData, region: r, district: d});
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await apiFetch(`/api/users/${initialUser.id}`, { method: 'PUT', body: JSON.stringify(formData) });
      const data = await res.json();
      localStorage.setItem('adc_user', JSON.stringify({ ...initialUser, ...formData, photo_url: data.photo_url }));
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
    } catch { setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' }); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
        setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas' });
        return;
    }
    setPassLoading(true);
    setMessage({ type: '', text: '' });
    try {
        const res = await apiFetch(`/api/users/${initialUser.id}/password`, { method: 'PUT', body: JSON.stringify(passwords) });
        if (!res.ok) throw new Error();
        setMessage({ type: 'success', text: 'Mot de passe modifié avec succès !' });
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch { setMessage({ type: 'error', text: 'Mot de passe actuel incorrect' }); }
    finally { setPassLoading(false); }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">MON PROFIL</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Gestion de compte ADC</p>
        </div>
        
        <AnimatePresence>
            {message.text && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} 
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl border shadow-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
                    <span className="font-bold text-sm">{message.text}</span>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner"><User size={24}/></div>
                <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Informations</h3>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-8">
              <div className="flex justify-center">
                <div className="relative">
                  <img src={formData.photo_url || '/placeholder.png'} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white shadow-2xl ring-1 ring-slate-100" />
                  <label className="absolute -bottom-2 -right-2 p-3 bg-emerald-600 rounded-2xl text-white shadow-lg cursor-pointer hover:bg-emerald-700 transition-all">
                    <Camera size={20}/>
                    <input type="file" className="hidden" accept="image/*" onChange={(e:any) => {
                        const reader = new FileReader();
                        reader.onloadend = () => setFormData({...formData, photo_url: reader.result as string});
                        if(e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
                    }}/>
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <InputGroup label="Prénom"><input type="text" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full bg-transparent outline-none text-slate-700 font-bold" /></InputGroup>
                <InputGroup label="Nom"><input type="text" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="w-full bg-transparent outline-none text-slate-700 font-bold" /></InputGroup>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <InputGroup label="Téléphone"><input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-transparent outline-none text-slate-700 font-bold" /></InputGroup>
                <InputGroup label="Email"><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-transparent outline-none text-slate-700 font-bold" /></InputGroup>
              </div>

              <div className="pt-8 border-t border-slate-100 space-y-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><MapPin size={14} className="text-emerald-500"/> Localisation Madagascar</p>
                <div className="grid md:grid-cols-3 gap-4">
                  <SelectGroup label="Province">
                    <select value={formData.province} onChange={handleProvinceChange} className="w-full bg-transparent outline-none text-slate-700 font-bold text-sm">
                        {Object.keys(MADAGASCAR_DATA).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </SelectGroup>
                  <SelectGroup label="Région">
                    <select value={formData.region} onChange={handleRegionChange} className="w-full bg-transparent outline-none text-slate-700 font-bold text-sm">
                        {Object.keys(MADAGASCAR_DATA[formData.province] || {}).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </SelectGroup>
                  <SelectGroup label="District">
                    <select value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} className="w-full bg-transparent outline-none text-slate-700 font-bold text-sm">
                        {(MADAGASCAR_DATA[formData.province]?.[formData.region] || []).map((d:string) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </SelectGroup>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <InputGroup label="Commune"><input type="text" value={formData.commune} onChange={(e) => setFormData({...formData, commune: e.target.value})} className="w-full bg-transparent outline-none text-slate-700 font-bold" /></InputGroup>
                  <InputGroup label="Fokontany"><input type="text" value={formData.fokontany} onChange={(e) => setFormData({...formData, fokontany: e.target.value})} className="w-full bg-transparent outline-none text-slate-700 font-bold" /></InputGroup>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-5 rounded-3xl font-black text-xs tracking-widest shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 transition-all disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                {loading ? 'ENREGISTREMENT...' : 'ENREGISTRER LES MODIFICATIONS'}
              </button>
            </form>
          </div>
        </div>

        {/* SECTION SÉCURITÉ */}
        <div className="space-y-8">
          <div className="bg-slate-900 p-8 md:p-10 rounded-[2.5rem] text-white shadow-2xl">
            <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center border border-white/5"><Key size={24}/></div>
                <h3 className="text-xl font-bold uppercase tracking-tight">Sécurité</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5">
              <DarkInput label="Mot de passe actuel" type="password" value={passwords.currentPassword} onChange={(e:any) => setPasswords({...passwords, currentPassword: e.target.value})} />
              <DarkInput label="Nouveau mot de passe" type="password" value={passwords.newPassword} onChange={(e:any) => setPasswords({...passwords, newPassword: e.target.value})} />
              <DarkInput label="Confirmer" type="password" value={passwords.confirmPassword} onChange={(e:any) => setPasswords({...passwords, confirmPassword: e.target.value})} />
              
              <button disabled={passLoading} className="w-full bg-white text-slate-900 p-5 rounded-2xl font-black text-[10px] tracking-[0.2em] shadow-lg hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50">
                {passLoading && <Loader2 className="animate-spin" size={16}/>}
                {passLoading ? 'TRAITEMENT...' : 'CHANGER LE MOT DE PASSE'}
              </button>
            </form>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-start gap-4">
             <div className="p-2 bg-amber-50 text-amber-500 rounded-lg"><Lock size={20}/></div>
             <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Protection des données</h4>
                <p className="text-xs text-slate-500 leading-relaxed">ADC utilise un chiffrement de niveau bancaire pour protéger vos informations de localisation et vos accès.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// COMPOSANTS DE STYLE
const InputGroup = ({ label, children }: any) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-widest">{label}</label>
    <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/5 focus-within:border-emerald-500 transition-all">
      {children}
    </div>
  </div>
);

const SelectGroup = ({ label, children }: any) => (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-widest">{label}</label>
      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl focus-within:bg-white focus-within:border-emerald-500 transition-all">
        {children}
      </div>
    </div>
);

const DarkInput = ({ label, type, value, onChange }: any) => (
    <div className="flex flex-col gap-2">
      <label className="text-[9px] font-bold text-white/30 uppercase ml-1 tracking-widest">{label}</label>
      <input type={type} value={value} onChange={onChange} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white/10 transition-all text-sm font-bold" required />
    </div>
);