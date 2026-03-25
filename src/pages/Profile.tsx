import React, { useState } from 'react';
import { User, Lock, Camera, Save, Key, MapPin, Mail, Phone, Loader2 } from 'lucide-react';
import { apiFetch } from '../lib/apiFetch';
import ConfirmModal from '../components/ConfirmModal';

const MADAGASCAR_DATA: any = {
    "Antananarivo": { "Analamanga":["Ambohidratrimo", "Andramasina", "Anjozorobe", "Ankazobe", "Antananarivo-Atsimondrano", "Antananarivo-Avaradrano", "Antananarivo-Renivohitra", "Manjakandriana"], "Bongolava":["Fenoarivobe", "Tsiroanomandidy"], "Itasy":["Arivonimamo", "Miarinarivo", "Soavinandriana"], "Vakinankaratra":["Ambatolampy", "Antanifotsy", "Antsirabe I", "Antsirabe II", "Betafo", "Faratsiho", "Mandoto"] },
    "Antsiranana": { "Diana":["Ambanja", "Ambilobe", "Antsiranana I", "Antsiranana II", "Nosy Be"], "Sava":["Andapa", "Antalaha", "Sambava", "Vohemar"] },
    "Fianarantsoa": { "Amoron'i Mania":["Ambatofinandrahana", "Ambositra", "Fandriana", "Manandriana"], "Haute Matsiatra":["Ambalavao", "Ambohimahasoa", "Fianarantsoa I", "Ikalamavony", "Isandra", "Lalangina", "Vohibato"], "Vatovavy": ["Ifanadiana", "Mananjary", "Nosy Varika"], "Fitovinany":["Ikongo", "Manakara", "Vohipeno"], "Atsimo-Atsinanana":["Befotaka", "Farafangana", "Midongy Sud", "Vangaindrano", "Vondrozo"], "Ihorombe":["Iakora", "Ihosy", "Ivohibe"] },
    "Mahajanga": { "Boeny":["Ambato-Boeny", "Mahajanga I", "Mahajanga II", "Marovoay", "Mitsinjo"], "Betsiboka": ["Kandreho", "Maevatanana", "Tsaratanana"], "Melaky":["Ambatomainty", "Antsalova", "Besalampy", "Maintirano", "Morafenobe"], "Sofia":["Analalava", "Antsohihy", "Bealanana", "Befandriana Nord", "Mampikony", "Mandritsara", "Port-Bergé"] },
    "Toamasina": { "Alaotra-Mangoro":["Ambatondrazaka", "Amparafaravola", "Andilamena", "Anosibe An'ala", "Moramanga"], "Atsinanana":["Antanambao-Manampotsy", "Brickaville", "Mahanoro", "Marolambo", "Toamasina I", "Toamasina II", "Vatomandry"], "Analanjirofo":["Fenoarivo Atsinanana", "Mananara Avaratra", "Maroantsetra", "Sainte Marie", "Soanierana Ivongo", "Vavatenina"] },
    "Toliara": { "Menabe":["Belo sur Tsiribihina", "Mahabo", "Manja", "Morondava"], "Atsimo-Andrefana":["Ampanihy Ouest", "Ankazoabo", "Betioky Sud", "Morombe", "Sakaraha", "Toliara I", "Toliara II"], "Androy": ["Ambovombe-Androy", "Bekily", "Beloha", "Tsihombe"], "Anosy": ["Amboasary Sud", "Betroka", "Taolagnaro"] }
};

export default function Profile() {
  const userStr = localStorage.getItem('adc_user');
  const initialUser = userStr ? JSON.parse(userStr) : null;

  const safeProv = initialUser?.province && MADAGASCAR_DATA[initialUser.province] ? initialUser.province : "Antananarivo";
  const safeRegs = Object.keys(MADAGASCAR_DATA[safeProv]);
  const safeReg = initialUser?.region && MADAGASCAR_DATA[safeProv][initialUser.region] ? initialUser.region : safeRegs[0];
  const safeDist = (MADAGASCAR_DATA[safeProv][safeReg] || [])[0] || "";

  const [formData, setFormData] = useState({
    first_name: initialUser?.first_name || '', last_name: initialUser?.last_name || '',
    phone: initialUser?.phone || '', email: initialUser?.email || '', photo_url: initialUser?.photo_url || '',
    province: safeProv, region: safeReg, district: initialUser?.district || safeDist,
    commune: initialUser?.commune || '', fokontany: initialUser?.fokontany || ''
  });

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  
  // POPUP STATE
  const [popup, setPopup] = useState({ isOpen: false, title: '', msg: '', type: 'success' as any });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch(`/api/users/${initialUser.id}`, { method: 'PUT', body: JSON.stringify(formData) });
      const data = await res.json();
      localStorage.setItem('adc_user', JSON.stringify({ ...initialUser, ...formData, photo_url: data.photo_url }));
      setPopup({ isOpen: true, title: 'Succès !', msg: 'Votre profil a été mis à jour.', type: 'success' });
    } catch { 
      setPopup({ isOpen: true, title: 'Erreur', msg: 'Impossible de mettre à jour le profil.', type: 'danger' });
    } finally { setLoading(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
        setPopup({ isOpen: true, title: 'Attention', msg: 'Les nouveaux mots de passe ne correspondent pas.', type: 'danger' });
        return;
    }
    setPassLoading(true);
    try {
        const res = await apiFetch(`/api/users/${initialUser.id}/password`, { method: 'PUT', body: JSON.stringify(passwords) });
        if (!res.ok) throw new Error();
        setPopup({ isOpen: true, title: 'Sécurité validée', msg: 'Votre mot de passe a été modifié avec succès.', type: 'success' });
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch { 
        setPopup({ isOpen: true, title: 'Erreur', msg: 'Le mot de passe actuel est incorrect.', type: 'danger' });
    } finally { setPassLoading(false); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 font-sans">
      <div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Mon Profil</h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-1 italic">Administration Madagascar</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
          <form onSubmit={handleUpdateProfile} className="space-y-10">
            <div className="flex justify-center">
              <div className="relative group">
                <img src={formData.photo_url || '/placeholder.png'} className="w-36 h-36 rounded-[2.5rem] object-cover border-4 border-white shadow-2xl ring-1 ring-slate-100 group-hover:scale-105 transition-transform" />
                <label className="absolute -bottom-2 -right-2 p-3.5 bg-emerald-600 rounded-2xl text-white shadow-xl cursor-pointer hover:bg-emerald-700 transition-all active:scale-90">
                  <Camera size={24}/>
                  <input type="file" className="hidden" accept="image/*" onChange={(e:any) => {
                      const reader = new FileReader();
                      reader.onloadend = () => setFormData({...formData, photo_url: reader.result as string});
                      if(e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
                  }}/>
                </label>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
               <ProfileInput label="Prénom" value={formData.first_name} onChange={(v:any)=>setFormData({...formData, first_name:v})} />
               <ProfileInput label="Nom" value={formData.last_name} onChange={(v:any)=>setFormData({...formData, last_name:v})} />
               <ProfileInput label="Téléphone" value={formData.phone} onChange={(v:any)=>setFormData({...formData, phone:v})} />
               <ProfileInput label="Email" value={formData.email} onChange={(v:any)=>setFormData({...formData, email:v})} />
            </div>

            <div className="bg-slate-50/50 p-8 rounded-[2.5rem] space-y-6">
                <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4"><MapPin size={16} className="text-emerald-500"/> Localisation ADC</div>
                <div className="grid md:grid-cols-3 gap-4">
                    <ProfileSelect label="Province" value={formData.province} options={Object.keys(MADAGASCAR_DATA)} 
                        onChange={(v:any)=>{ const r = Object.keys(MADAGASCAR_DATA[v])[0]; setFormData({...formData, province: v, region: r, district: MADAGASCAR_DATA[v][r][0]})}} />
                    <ProfileSelect label="Région" value={formData.region} options={Object.keys(MADAGASCAR_DATA[formData.province] || {})} 
                        onChange={(v:any)=>{ setFormData({...formData, region: v, district: MADAGASCAR_DATA[formData.province][v][0]})}} />
                    <ProfileSelect label="District" value={formData.district} options={MADAGASCAR_DATA[formData.province]?.[formData.region] ||[]} 
                        onChange={(v:any)=>setFormData({...formData, district: v})} />
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                   <ProfileInput label="Commune" value={formData.commune} onChange={(v:any)=>setFormData({...formData, commune:v})} />
                   <ProfileInput label="Fokontany" value={formData.fokontany} onChange={(v:any)=>setFormData({...formData, fokontany:v})} />
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-6 rounded-[2rem] font-black text-xs tracking-widest shadow-2xl shadow-emerald-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
              ENREGISTRER LES MODIFICATIONS
            </button>
          </form>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 p-8 md:p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-4 mb-10"><div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center border border-white/5"><Key size={24}/></div><h3 className="text-xl font-bold uppercase tracking-tighter">Sécurité</h3></div>
            <form onSubmit={handleChangePassword} className="space-y-5">
              <ProfileDarkInput label="Actuel" value={passwords.currentPassword} onChange={(v:any)=>setPasswords({...passwords, currentPassword:v})} />
              <ProfileDarkInput label="Nouveau" value={passwords.newPassword} onChange={(v:any)=>setPasswords({...passwords, newPassword:v})} />
              <ProfileDarkInput label="Confirmer" value={passwords.confirmPassword} onChange={(v:any)=>setPasswords({...passwords, confirmPassword:v})} />
              <button disabled={passLoading} className="w-full bg-white text-slate-900 p-5 rounded-2xl font-black text-[10px] tracking-widest shadow-xl mt-4 active:scale-95 transition-all flex items-center justify-center gap-2">
                {passLoading && <Loader2 className="animate-spin" size={16}/>} CHANGER LE MOT DE PASSE
              </button>
            </form>
          </div>
        </div>
      </div>

      <ConfirmModal isOpen={popup.isOpen} title={popup.title} message={popup.msg} type={popup.type} onlyConfirm onCancel={() => setPopup({ ...popup, isOpen: false })} />
    </div>
  );
}

const ProfileInput = ({ label, value, onChange }: any) => (
    <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{label}</label><input type="text" value={value} onChange={(e)=>onChange(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:bg-white ring-1 ring-slate-100 focus:ring-2 focus:ring-emerald-500 transition-all outline-none" /></div>
);
const ProfileSelect = ({ label, value, options, onChange }: any) => (
    <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{label}</label><select value={value} onChange={(e)=>onChange(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 ring-1 ring-slate-100 transition-all outline-none">{options.map((o:any)=><option key={o} value={o}>{o}</option>)}</select></div>
);
const ProfileDarkInput = ({ label, value, onChange }: any) => (
    <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">{label}</label><input type="password" value={value} onChange={(e)=>onChange(e.target.value)} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 transition-all" required /></div>
);