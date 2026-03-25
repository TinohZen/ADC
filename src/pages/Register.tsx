import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Mail, Lock, Camera, CheckCircle2, ArrowRight, Eye, EyeOff, MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    if(!formData.photo_url) return setStatus({...status, error: "Photo de profil obligatoire"});
    setStatus({...status, loading: true, error: ''});
    try {
      const res = await fetch('/api/register', { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(formData)
      });
      if(res.ok) setStatus({...status, success: true, loading: false});
      else {
          const d = await res.json();
          throw new Error(d.error || "Erreur lors de l'inscription");
      }
    } catch(err: any) { setStatus({...status, loading: false, error: err.message}); }
  };

  if (status.success) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans uppercase">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-md border border-slate-100">
        <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-emerald-500 shadow-inner">
            <CheckCircle2 size={48} />
        </div>
        <h2 className="text-2xl font-black mb-3 text-slate-800 tracking-tighter">INSCRIPTION RÉUSSIE</h2>
        <p className="text-slate-400 font-bold text-[10px] mb-10 leading-relaxed tracking-[0.2em]">Un administrateur doit valider votre accès avant que vous puissiez vous connecter.</p>
        <Link to="/login" className="flex items-center justify-center gap-2 w-full bg-emerald-600 text-white py-5 rounded-[1.5rem] font-black tracking-widest text-xs shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95">
            RETOUR CONNEXION <ArrowRight size={18}/>
        </Link>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-50 via-slate-50 to-slate-100 flex items-center justify-center p-4 py-12 font-sans">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl w-full max-w-lg border border-white relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>

        <div className="text-center mb-10">
            <img src="/logoADC.png" alt="Logo" className="w-24 h-24 mx-auto mb-6 object-contain" />
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Rejoindre l'ADC</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2 italic">Association Madagascar</p>
        </div>

        {status.error && (
          <motion.div initial={{ x: 10 }} animate={{ x: 0 }} className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 text-[10px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-2">
            <AlertCircle size={16}/> {status.error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center mb-8">
            <label className="relative cursor-pointer group">
              <div className="w-28 h-28 rounded-[2rem] bg-slate-50 border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden group-hover:scale-105 transition-all ring-1 ring-slate-100">
                {formData.photo_url ? <img src={formData.photo_url} className="w-full h-full object-cover" /> : <Camera size={32} className="text-slate-300" />}
              </div>
              <div className="absolute -bottom-2 -right-2 p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg border-2 border-white"><Camera size={16}/></div>
              <input type="file" className="hidden" accept="image/*" onChange={(e:any) => {
                const reader = new FileReader();
                reader.onloadend = () => setFormData({...formData, photo_url: reader.result as string});
                if(e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
              }} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputRegister label="Prénom" name="first_name" placeholder="Mickaël" value={formData.first_name} onChange={handleChange} required />
            <InputRegister label="Nom" name="last_name" placeholder="RANDRIAN..." value={formData.last_name} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectRegister label="Province">
                <select name="province" value={formData.province} onChange={handleProvinceChange} className="w-full bg-transparent outline-none font-bold text-xs">
                    {Object.keys(MADAGASCAR_DATA).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </SelectRegister>
            <SelectRegister label="Région">
                <select name="region" value={formData.region} onChange={handleRegionChange} className="w-full bg-transparent outline-none font-bold text-xs">
                    {Object.keys(MADAGASCAR_DATA[formData.province]).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </SelectRegister>
          </div>

          <SelectRegister label="District">
            <select name="district" value={formData.district} onChange={handleChange} className="w-full bg-transparent outline-none font-bold text-xs">
              {MADAGASCAR_DATA[formData.province][formData.region].map((d:string) => <option key={d} value={d}>{d}</option>)}
            </select>
          </SelectRegister>

          <div className="grid grid-cols-2 gap-4">
            <InputRegister label="Commune" name="commune" placeholder="Namehana" value={formData.commune} onChange={handleChange} required />
            <InputRegister label="Fokontany" name="fokontany" placeholder="FKT..." value={formData.fokontany} onChange={handleChange} required />
          </div>

          <InputRegister label="Téléphone" name="phone" type="tel" placeholder="034 00 000 00" value={formData.phone} onChange={handleChange} required />
          <InputRegister label="Email" name="email" type="email" placeholder="mickael@adc.org" value={formData.email} onChange={handleChange} required />
          
          <div className="relative">
            <InputRegister label="Mot de passe" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleChange} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 bottom-4 text-slate-300 hover:text-emerald-500 transition-colors">
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>

          <button type="submit" disabled={status.loading} className="w-full bg-slate-900 text-white p-5 rounded-[1.5rem] font-black tracking-[0.2em] text-xs shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70">
            {status.loading && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Loader2 size={20}/></motion.div>}
            {status.loading ? 'CRÉATION DU COMPTE...' : "S'INSCRIRE MAINTENANT"}
          </button>
        </form>

        <p className="text-center mt-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Déjà membre de l'ADC ? <Link to="/login" className="text-emerald-600 hover:underline">Se connecter</Link>
        </p>
      </motion.div>
    </div>
  );
}

const InputRegister = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">{label}</label>
    <input {...props} className="w-full p-4 bg-slate-50 border border-transparent rounded-[1.2rem] text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-200 transition-all placeholder:text-slate-200" />
  </div>
);

const SelectRegister = ({ label, children }: any) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">{label}</label>
      <div className="w-full p-4 bg-slate-50 border border-transparent rounded-[1.2rem] text-xs font-bold text-slate-700 focus-within:bg-white focus-within:border-emerald-200 transition-all">
        {children}
      </div>
    </div>
);