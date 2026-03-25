import React, { useState } from 'react';
import { User, Lock, Camera, Save, Key, MapPin } from 'lucide-react';
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

  const [formData, setFormData] = useState({
    first_name: initialUser?.first_name || '', last_name: initialUser?.last_name || '',
    phone: initialUser?.phone || '', email: initialUser?.email || '', photo_url: initialUser?.photo_url || '',
    province: initialUser?.province || 'Antananarivo', region: initialUser?.region || 'Analamanga',
    district: initialUser?.district || 'Antananarivo-Renivohitra', commune: initialUser?.commune || '', fokontany: initialUser?.fokontany || ''
  });

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch(`/api/users/${initialUser.id}`, { method: 'PUT', body: JSON.stringify(formData) });
      const data = await res.json();
      localStorage.setItem('adc_user', JSON.stringify({ ...initialUser, ...formData, photo_url: data.photo_url }));
      setMessage({ type: 'success', text: 'Profil mis à jour !' });
    } catch { setMessage({ type: 'error', text: 'Erreur mise à jour' }); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return setMessage({ type: 'error', text: 'Mots de passe différents' });
    try {
        await apiFetch(`/api/users/${initialUser.id}/password`, { method: 'PUT', body: JSON.stringify(passwords) });
        setMessage({ type: 'success', text: 'Mot de passe modifié !' });
    } catch { setMessage({ type: 'error', text: 'Erreur mot de passe' }); }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8">
      <div><h2 className="text-2xl font-bold text-slate-800">Mon Profil</h2><p className="text-slate-500 text-sm">Gérez vos informations et votre sécurité</p></div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* COLONNE GAUCHE: PROFIL */}
        <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><User size={20} className="text-emerald-600"/> Infos Personnelles</h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="flex justify-center mb-6">
                <label className="cursor-pointer relative"><img src={formData.photo_url} className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-md" /><input type="file" className="hidden" accept="image/*" onChange={(e:any) => { const reader = new FileReader(); reader.onloadend = () => setFormData({...formData, photo_url: reader.result as string}); reader.readAsDataURL(e.target.files[0]); }}/></label>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <input type="text" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="p-3 bg-slate-50 border rounded-xl" placeholder="Prénom" />
                <input type="text" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="p-3 bg-slate-50 border rounded-xl" placeholder="Nom" />
            </div>
            {/* SÉLECTEURS GÉO */}
            <div className="grid grid-cols-2 gap-4">
              <select value={formData.province} onChange={(e) => { const prov = e.target.value; const reg = Object.keys(MADAGASCAR_DATA[prov])[0]; setFormData({...formData, province: prov, region: reg, district: MADAGASCAR_DATA[prov][reg][0]})}} className="p-3 bg-slate-50 border rounded-xl text-sm">{Object.keys(MADAGASCAR_DATA).map(p => <option key={p} value={p}>{p}</option>)}</select>
              <select value={formData.region} onChange={(e) => { const reg = e.target.value; setFormData({...formData, region: reg, district: MADAGASCAR_DATA[formData.province][reg][0]})}} className="p-3 bg-slate-50 border rounded-xl text-sm">{Object.keys(MADAGASCAR_DATA[formData.province]).map(r => <option key={r} value={r}>{r}</option>)}</select>
            </div>
            <select value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl text-sm">
                {(MADAGASCAR_DATA[formData.province][formData.region]).map((d:string) => <option key={d} value={d}>{d}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-4">
                <input type="text" value={formData.commune} onChange={(e) => setFormData({...formData, commune: e.target.value})} className="p-3 bg-slate-50 border rounded-xl" placeholder="Commune" />
                <input type="text" value={formData.fokontany} onChange={(e) => setFormData({...formData, fokontany: e.target.value})} className="p-3 bg-slate-50 border rounded-xl" placeholder="Fokontany" />
            </div>
            <button className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2"><Save size={18}/> Enregistrer</button>
          </form>
        </div>

        {/* COLONNE DROITE: SÉCURITÉ */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Key size={20} className="text-emerald-600"/> Sécurité</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
                <input type="password" placeholder="Mot de passe actuel" onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl text-sm" />
                <input type="password" placeholder="Nouveau mot de passe" onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl text-sm" />
                <input type="password" placeholder="Confirmer" onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl text-sm" />
                <button className="w-full bg-slate-800 text-white p-3 rounded-xl font-bold">Changer</button>
            </form>
        </div>
      </div>
    </div>
  );
}