import React, { useState } from 'react';
import { User, Phone, Mail, Camera, Save, MapPin } from 'lucide-react';
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
    first_name: initialUser?.first_name || '',
    last_name: initialUser?.last_name || '',
    phone: initialUser?.phone || '',
    email: initialUser?.email || '',
    photo_url: initialUser?.photo_url || '',
    province: initialUser?.province || 'Antananarivo',
    region: initialUser?.region || 'Analamanga',
    district: initialUser?.district || 'Antananarivo-Renivohitra',
    commune: initialUser?.commune || '',
    fokontany: initialUser?.fokontany || ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleProvinceChange = (e: any) => {
    const prov = e.target.value;
    const firstReg = Object.keys(MADAGASCAR_DATA[prov])[0];
    const firstDist = MADAGASCAR_DATA[prov][firstReg][0];
    setFormData({...formData, province: prov, region: firstReg, district: firstDist});
  };

  const handleRegionChange = (e: any) => {
    const reg = e.target.value;
    const firstDist = MADAGASCAR_DATA[formData.province][reg][0];
    setFormData({...formData, region: reg, district: firstDist});
  };

  const handleUpdate = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch(`/api/users/${initialUser.id}`, { method: 'PUT', body: JSON.stringify(formData) });
      const data = await res.json();
      localStorage.setItem('adc_user', JSON.stringify({ ...initialUser, ...formData, photo_url: data.photo_url }));
      setMessage('Profil mis à jour !');
    } catch { setMessage('Erreur'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <h2 className="text-2xl font-bold">Mon Profil</h2>
      {message && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-center">{message}</div>}

      <form onSubmit={handleUpdate} className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
        <div className="flex justify-center">
            <label className="cursor-pointer">
                <img src={formData.photo_url} className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-md" />
                <input type="file" className="hidden" accept="image/*" onChange={(e:any) => {
                    const reader = new FileReader();
                    reader.onloadend = () => setFormData({...formData, photo_url: reader.result as string});
                    reader.readAsDataURL(e.target.files[0]);
                }} />
            </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <input type="text" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="p-3 bg-slate-50 border rounded-xl" placeholder="Prénom" />
            <input type="text" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="p-3 bg-slate-50 border rounded-xl" placeholder="Nom" />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Province</label>
                <select value={formData.province} onChange={handleProvinceChange} className="w-full p-3 bg-slate-50 border rounded-xl text-sm">
                    {Object.keys(MADAGASCAR_DATA).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Région</label>
                <select value={formData.region} onChange={handleRegionChange} className="w-full p-3 bg-slate-50 border rounded-xl text-sm">
                    {Object.keys(MADAGASCAR_DATA[formData.province]).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
        </div>

        <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">District</label>
            <select value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl text-sm">
                {MADAGASCAR_DATA[formData.province][formData.region].map((d:string) => <option key={d} value={d}>{d}</option>)}
            </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <input type="text" value={formData.commune} onChange={(e) => setFormData({...formData, commune: e.target.value})} className="p-3 bg-slate-50 border rounded-xl" placeholder="Commune" />
            <input type="text" value={formData.fokontany} onChange={(e) => setFormData({...formData, fokontany: e.target.value})} className="p-3 bg-slate-50 border rounded-xl" placeholder="Fokontany" />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
            <Save size={18}/> {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
}