import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Mail, Lock, Camera, CheckCircle2, ArrowRight, Eye, EyeOff, MapPin, Loader2, AlertCircle } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleProvinceChange = (e: any) => {
    const p = e.target.value;
    const regions = Object.keys(MADAGASCAR_DATA[p] || {});
    const r = regions[0] || "";
    const d = (MADAGASCAR_DATA[p][r] || [])[0] || "";
    setFormData({...formData, province: p, region: r, district: d});
  };

  const handleRegionChange = (e: any) => {
    const r = e.target.value;
    const d = (MADAGASCAR_DATA[formData.province][r] || [])[0] || "";
    setFormData({...formData, region: r, district: d});
  };

  const handleChange = (e: any) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if(!formData.photo_url) return setStatus({...status, error: "Photo obligatoire"});
    setStatus({...status, loading: true, error: ''});
    try {
      const res = await fetch('/api/register', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(formData)});
      if(res.ok) setStatus({...status, success: true, loading: false});
      else { const d = await res.json(); throw new Error(d.error || "Erreur"); }
    } catch(err: any) { setStatus({...status, loading: false, error: err.message}); }
  };

  if (status.success) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-md border border-slate-100">
        <CheckCircle2 size={60} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black mb-3">INSCRIPTION RÉUSSIE</h2>
        <p className="text-slate-500 mb-8">Un administrateur doit valider votre compte.</p>
        <Link to="/login" className="block w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold">Retour Connexion</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 py-12 font-sans">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-white">
        <div className="text-center mb-10">
          <img src="/logoADC.png" alt="Logo" className="w-24 h-24 mx-auto mb-4 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; document.getElementById('logo-fallback-reg')!.style.display = 'flex'; }} />
          <div id="logo-fallback-reg" className="hidden w-16 h-16 bg-emerald-600 text-white rounded-2xl items-center justify-center font-bold text-2xl mx-auto mb-4 shadow-lg shadow-emerald-600/20 rotate-3">ADC</div>
          <h1 className="text-3xl font-black text-slate-800">Rejoindre l'ADC</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Association Madagascar</p>
        </div>

        {status.error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-xs font-bold border border-red-100 flex items-center gap-2"><AlertCircle size={16}/> {status.error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center mb-6">
            <label className="relative cursor-pointer group">
              <div className="w-24 h-24 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden group-hover:border-emerald-500 transition-all">
                {formData.photo_url ? <img src={formData.photo_url} className="w-full h-full object-cover" /> : <Camera size={32} className="text-slate-300" />}
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={(e:any) => {
                const reader = new FileReader();
                reader.onloadend = () => setFormData({...formData, photo_url: reader.result as string});
                if(e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
              }} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputReg label="Prénom" name="first_name" value={formData.first_name} onChange={handleChange} />
            <InputReg label="Nom" name="last_name" value={formData.last_name} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectReg label="Province" value={formData.province} onChange={handleProvinceChange} options={Object.keys(MADAGASCAR_DATA)} />
            <SelectReg label="Région" value={formData.region} onChange={handleRegionChange} options={Object.keys(MADAGASCAR_DATA[formData.province] || {})} />
          </div>

          <SelectReg label="District" value={formData.district} onChange={handleChange} name="district" options={MADAGASCAR_DATA[formData.province][formData.region] || []} />

          <div className="grid grid-cols-2 gap-4">
            <InputReg label="Commune" name="commune" value={formData.commune} onChange={handleChange} />
            <InputReg label="Fokontany" name="fokontany" value={formData.fokontany} onChange={handleChange} />
          </div>

          <InputReg label="Téléphone" name="phone" value={formData.phone} onChange={handleChange} />
          <InputReg label="Email" name="email" value={formData.email} onChange={handleChange} />
          
          <div className="relative">
            <InputReg label="Mot de passe" name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 bottom-4 text-slate-300">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
          </div>

          <button type="submit" disabled={status.loading} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-xs tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3">
            {status.loading && <Loader2 size={20} className="animate-spin"/>} S'INSCRIRE MAINTENANT
          </button>
        </form>
        <p className="text-center mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Déjà membre ? <Link to="/login" className="text-emerald-600 hover:underline">Se connecter</Link></p>
      </motion.div>
    </div>
  );
}

const InputReg = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
    <input {...props} className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500 transition-all" required />
  </div>
);

const SelectReg = ({ label, value, options, onChange, name }: any) => (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
      <select name={name} value={value} onChange={onChange} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none focus:bg-white transition-all">
        {options.map((o: any) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
);