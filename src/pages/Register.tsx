import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Mail, Lock, Camera, CheckCircle2, ArrowRight, Eye, EyeOff, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const MADAGASCAR_DATA: any = {
    "Antananarivo": { "Analamanga": ["Ambohidratrimo", "Andramasina", "Anjozorobe", "Ankazobe", "Antananarivo-Atsimondrano", "Antananarivo-Avaradrano", "Antananarivo-Renivohitra", "Manjakandriana"], "Bongolava": ["Fenoarivobe", "Tsiroanomandidy"], "Itasy": ["Arivonimamo", "Miarinarivo", "Soavinandriana"], "Vakinankaratra": ["Ambatolampy", "Antanifotsy", "Antsirabe I", "Antsirabe II", "Betafo", "Faratsiho", "Mandoto"] },
    "Antsiranana": { "Diana": ["Ambanja", "Ambilobe", "Antsiranana I", "Antsiranana II", "Nosy Be"], "Sava": ["Andapa", "Antalaha", "Sambava", "Vohemar"] },
    "Fianarantsoa": { "Amoron'i Mania": ["Ambatofinandrahana", "Ambositra", "Fandriana", "Manandriana"], "Haute Matsiatra": ["Ambalavao", "Ambohimahasoa", "Fianarantsoa I", "Ikalamavony", "Isandra", "Lalangina", "Vohibato"], "Vatovavy": ["Ifanadiana", "Mananjary", "Nosy Varika"], "Fitovinany": ["Ikongo", "Manakara", "Vohipeno"], "Atsimo-Atsinanana": ["Befotaka", "Farafangana", "Midongy Sud", "Vangaindrano", "Vondrozo"], "Ihorombe": ["Iakora", "Ihosy", "Ivohibe"] },
    "Mahajanga": { "Boeny": ["Ambato-Boeny", "Mahajanga I", "Mahajanga II", "Marovoay", "Mitsinjo"], "Betsiboka": ["Kandreho", "Maevatanana", "Tsaratanana"], "Melaky": ["Ambatomainty", "Antsalova", "Besalampy", "Maintirano", "Morafenobe"], "Sofia": ["Analalava", "Antsohihy", "Bealanana", "Befandriana Nord", "Mampikony", "Mandritsara", "Port-Bergé"] },
    "Toamasina": { "Alaotra-Mangoro": ["Ambatondrazaka", "Amparafaravola", "Andilamena", "Anosibe An'ala", "Moramanga"], "Atsinanana": ["Antanambao-Manampotsy", "Brickaville", "Mahanoro", "Marolambo", "Toamasina I", "Toamasina II", "Vatomandry"], "Analanjirofo": ["Fenoarivo Atsinanana", "Mananara Avaratra", "Maroantsetra", "Sainte Marie", "Soanierana Ivongo", "Vavatenina"] },
    "Toliara": { "Menabe": ["Belo sur Tsiribihina", "Mahabo", "Manja", "Morondava"], "Atsimo-Andrefana": ["Ampanihy Ouest", "Ankazoabo", "Betioky Sud", "Morombe", "Sakaraha", "Toliara I", "Toliara II"], "Androy": ["Ambovombe-Androy", "Bekily", "Beloha", "Tsihombe"], "Anosy": ["Amboasary Sud", "Betroka", "Taolagnaro"] }
};

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', phone: '', email: '', password: '', photo_url: '',
    province: 'Antananarivo', region: 'Analamanga', district: 'Antananarivo-Renivohitra', commune: '', fokontany: ''
  });
  const [status, setStatus] = useState({ error: '', loading: false, success: false });
  const navigate = useNavigate();

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

  const handleChange = (e: any) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if(!formData.photo_url) return setStatus({...status, error: "Photo obligatoire"});
    setStatus({...status, loading: true});
    try {
      const res = await fetch('/api/register', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(formData)});
      if(res.ok) setStatus({...status, success: true});
      else throw new Error("Erreur");
    } catch(err) { setStatus({...status, loading: false, error: "Erreur inscription"}); }
  };

  if (status.success) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-sm">
        <CheckCircle2 size={60} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-slate-800">C'est fait !</h2>
        <p className="text-slate-500 mb-8">Attendez la validation par un Admin.</p>
        <Link to="/login" className="block w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">Retour Connexion</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 py-12">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">Rejoindre l'ADC</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center mb-6">
            <label className="relative cursor-pointer group">
              <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden group-hover:border-emerald-500 transition-colors">
                {formData.photo_url ? <img src={formData.photo_url} className="w-full h-full object-cover" /> : <Camera className="text-slate-300" />}
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={(e:any) => {
                const reader = new FileReader();
                reader.onloadend = () => setFormData({...formData, photo_url: reader.result as string});
                reader.readAsDataURL(e.target.files[0]);
              }} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input type="text" name="first_name" placeholder="Prénom" onChange={handleChange} className="p-3 bg-slate-50 border rounded-xl w-full" required />
            <input type="text" name="last_name" placeholder="Nom" onChange={handleChange} className="p-3 bg-slate-50 border rounded-xl w-full" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Province</label>
              <select name="province" value={formData.province} onChange={handleProvinceChange} className="w-full p-3 bg-slate-50 border rounded-xl text-sm">
                {Object.keys(MADAGASCAR_DATA).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Région</label>
              <select name="region" value={formData.region} onChange={handleRegionChange} className="w-full p-3 bg-slate-50 border rounded-xl text-sm">
                {Object.keys(MADAGASCAR_DATA[formData.province]).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">District</label>
            <select name="district" value={formData.district} onChange={handleChange} className="w-full p-3 bg-slate-50 border rounded-xl text-sm">
              {MADAGASCAR_DATA[formData.province][formData.region].map((d:string) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input type="text" name="commune" placeholder="Commune" onChange={handleChange} className="p-3 bg-slate-50 border rounded-xl w-full" required />
            <input type="text" name="fokontany" placeholder="Fokontany" onChange={handleChange} className="p-3 bg-slate-50 border rounded-xl w-full" required />
          </div>

          <input type="tel" name="phone" placeholder="Téléphone" onChange={handleChange} className="w-full p-3 bg-slate-50 border rounded-xl" required />
          <input type="password" name="password" placeholder="Mot de passe" onChange={handleChange} className="w-full p-3 bg-slate-50 border rounded-xl" required />

          <button type="submit" disabled={status.loading} className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg">
            {status.loading ? 'Patientez...' : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  );
}