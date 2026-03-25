import React, { useState } from 'react';
import { User, Lock, Camera, Save, Key, MapPin, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
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

  // Sécurité pour l'initialisation (si les données DB sont vides)
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
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await apiFetch(`/api/users/${initialUser.id}`, { method: 'PUT', body: JSON.stringify(formData) });
      const data = await res.json();
      const updated = { ...initialUser, ...formData, photo_url: data.photo_url };
      localStorage.setItem('adc_user', JSON.stringify(updated));
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
    } catch { setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' }); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
    try {
        const res = await apiFetch(`/api/users/${initialUser.id}/password`, { method: 'PUT', body: JSON.stringify(passwords) });
        if (!res.ok) throw new Error();
        setMessage({ type: 'success', text: 'Mot de passe modifié !' });
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch { setMessage({ type: 'error', text: 'Mot de passe actuel incorrect' }); }
  };

  // Listes dynamiques sécurisées
  const provinces = Object.keys(MADAGASCAR_DATA);
  const regions = Object.keys(MADAGASCAR_DATA[formData.province] || {});
  const districts = MADAGASCAR_DATA[formData.province]?.[formData.region] || [];

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Mon Profil</h2>
          <p className="text-slate-500 text-sm">Gérez vos informations et la sécurité de votre compte</p>
        </div>
        {message.text && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`px-4 py-2 rounded-xl text-sm font-bold border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
            {message.text}
          </motion.div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* INFOS PERSONNELLES */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><User size={20}/></div>
              <h3 className="font-bold text-slate-800 text-lg">Informations Personnelles</h3>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex justify-center">
                <label className="relative group cursor-pointer">
                  <img src={formData.photo_url || '/placeholder-user.png'} className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl group-hover:opacity-80 transition-all" />
                  <div className="absolute bottom-0 right-0 p-2 bg-emerald-600 rounded-full text-white shadow-lg"><Camera size={16}/></div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e:any) => {
                    const reader = new FileReader();
                    reader.onloadend = () => setFormData({...formData, photo_url: reader.result as string});
                    if(e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
                  }}/>
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Prénom</label>
                  <input type="text" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nom</label>
                  <input type="text" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Téléphone</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-slate-400 mb-2 font-bold text-[10px] uppercase tracking-widest"><MapPin size={14}/> Localisation</div>
                <div className="grid md:grid-cols-3 gap-4">
                  <select value={formData.province} onChange={(e) => { 
                    const p = e.target.value; 
                    const r = Object.keys(MADAGASCAR_DATA[p])[0];
                    setFormData({...formData, province: p, region: r, district: MADAGASCAR_DATA[p][r][0]}) 
                  }} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none">
                    {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={formData.region} onChange={(e) => {
                    const r = e.target.value;
                    setFormData({...formData, region: r, district: MADAGASCAR_DATA[formData.province][r][0]})
                  }} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none">
                    {regions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <select value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none">
                    {districts.map((d:string) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Commune" value={formData.commune} onChange={(e) => setFormData({...formData, commune: e.target.value})} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none" />
                  <input type="text" placeholder="Fokontany" value={formData.fokontany} onChange={(e) => setFormData({...formData, fokontany: e.target.value})} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all">
                <Save size={18}/> {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </form>
          </div>
        </div>

        {/* SÉCURITÉ */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-600"><Key size={20}/></div>
              <h3 className="font-bold text-slate-800 text-lg">Sécurité</h3>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Mot de passe actuel</label>
                <input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-slate-500/10" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nouveau mot de passe</label>
                <input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-slate-500/10" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Confirmer</label>
                <input type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-slate-500/10" required />
              </div>
              <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white p-4 rounded-2xl font-bold shadow-lg transition-all mt-4">
                Changer le mot de passe
              </button>
            </form>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl">
             <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2"><Lock size={16}/> Note de sécurité</h4>
             <p className="text-xs text-amber-700 leading-relaxed">Ne partagez jamais vos identifiants. Nous vous conseillons de changer votre mot de passe tous les 3 mois pour une sécurité maximale.</p>
          </div>
        </div>
      </div>
    </div>
  );
}