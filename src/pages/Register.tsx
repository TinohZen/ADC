import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Mail, Lock, Camera, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

// 1. Définition stricte des types
interface RegisterFormData {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  password: string;
  photo_url: string;
}

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: React.ReactNode;
  rightElement?: React.ReactNode;
}

// 2. Sous-composant réutilisable pour éviter la duplication (DRY)
const InputField: React.FC<InputFieldProps> = ({ label, icon, rightElement, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
        {icon}
      </div>
      <input
        {...props}
        className={`block w-full pl-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm ${rightElement ? 'pr-10' : 'pr-3'}`}
      />
      {rightElement}
    </div>
  </div>
);

export default function Register() {
  // 3. Initialisation des états
  const [formData, setFormData] = useState<RegisterFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    password: '',
    photo_url: ''
  });
  const [status, setStatus] = useState({ error: '', loading: false, success: false });
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();

  // 4. Gestionnaires d'événements
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, photo_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ error: '', loading: false, success: false });

    if (!formData.photo_url) {
      setStatus(prev => ({ ...prev, error: 'Veuillez télécharger une photo de profil obligatoire.' }));
      return;
    }

    setStatus(prev => ({ ...prev, loading: true }));

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur lors de l'inscription");

      setStatus({ error: '', loading: false, success: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur inattendue est survenue.";
      setStatus({ error: errorMessage, loading: false, success: false });
    }
  };

  // 5. Rendu de la vue Succès
  if (status.success) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-slate-50 to-slate-100 flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 w-full max-w-md text-center border border-slate-100"
        >
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">Inscription réussie !</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Votre demande d'inscription a été envoyée avec succès. Un administrateur doit valider votre compte avant que vous puissiez vous connecter.
          </p>
          <Link
            to="/login"
            className="inline-flex w-full justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-md shadow-emerald-600/20"
          >
            Retour à la connexion
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    );
  }

  // 6. Rendu du formulaire principal
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-slate-50 to-slate-100 flex items-center justify-center p-4 py-12 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 w-full max-w-md border border-slate-100"
      >
        <div className="text-center mb-8">
          <img 
            src="/logoADC.png" 
            alt="ADC Logo" 
            className="w-24 h-24 mx-auto mb-4 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = document.getElementById('logo-fallback-reg');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div id="logo-fallback-reg" className="hidden w-12 h-12 bg-emerald-600 text-white rounded-xl items-center justify-center font-bold text-xl mx-auto mb-4 shadow-lg shadow-emerald-600/20 rotate-3">
            ADC
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Rejoindre l'ADC</h1>
          <p className="text-slate-500 mt-2 text-sm">Tous les champs sont obligatoires pour valider votre profil</p>
        </div>

        {status.error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-xl mb-6 text-sm flex items-center gap-2">
            {status.error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="flex justify-center mb-8">
            <div className={`relative group p-1 rounded-full border-2 ${!formData.photo_url && status.error ? 'border-red-300' : 'border-transparent'}`}>
              <div className="w-24 h-24 rounded-full bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden group-hover:border-emerald-400 transition-colors">
                {formData.photo_url ? (
                  <img src={formData.photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="h-8 w-8 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-emerald-600 p-2 rounded-full text-white cursor-pointer hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/30">
                <Camera size={16} />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField label="Prénom" name="first_name" type="text" value={formData.first_name} onChange={handleChange} icon={<User className="h-4 w-4" />} required />
            <InputField label="Nom" name="last_name" type="text" value={formData.last_name} onChange={handleChange} icon={<User className="h-4 w-4" />} required />
          </div>

          <InputField label="Téléphone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="03........" icon={<Phone className="h-4 w-4" />} required />
          <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@exemple.com" icon={<Mail className="h-4 w-4" />} required />
          
          <InputField 
            label="Mot de passe" 
            name="password" 
            type={showPassword ? "text" : "password"} 
            value={formData.password} 
            onChange={handleChange} 
            placeholder="••••••••" 
            icon={<Lock className="h-4 w-4" />} 
            required 
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-emerald-600 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          <button
            type="submit"
            disabled={status.loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-70 mt-6"
          >
            {status.loading ? 'Inscription en cours...' : "S'inscrire maintenant"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          Déjà membre ?{' '}
          <Link to="/login" className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline transition-colors">
            Se connecter
          </Link>
        </div>
      </motion.div>
    </div>
  );
}