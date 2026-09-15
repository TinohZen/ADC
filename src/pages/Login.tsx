import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, LogIn, Eye, EyeOff, KeyRound, X, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../lib/apiFetch';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState({ error: '', success: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erreur de connexion');
      if (data.user.status === 'pending') throw new Error('Votre compte est en attente de validation par un administrateur.');
      if (data.user.status === 'rejected') throw new Error('Votre compte a été refusé.');

      localStorage.setItem('adc_token', data.token); 
      localStorage.setItem('adc_user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg({ error: '', success: '' });
    setForgotLoading(true);

    try {
      const res = await apiFetch('/api/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ phone: forgotPhone, email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible d'envoyer le code.");
      
      if (data.code) {
        setForgotCode(data.code);
      }

      setForgotMsg({ 
        error: '', 
        success: data.message || 'Code généré avec succès !' 
      });
      setForgotStep(2);
    } catch (err: any) {
      setForgotMsg({ error: err.message, success: '' });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg({ error: '', success: '' });
    setForgotLoading(true);

    try {
      const res = await apiFetch('/api/reset-password', {
        method: 'POST',
        body: JSON.stringify({ phone: forgotPhone, code: forgotCode, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Code invalide ou expiré.');

      setForgotMsg({ error: '', success: 'Mot de passe mis à jour ! Redirection...' });
      setTimeout(() => {
        setShowForgot(false);
        setForgotStep(1);
        setPhone(forgotPhone);
      }, 1500);
    } catch (err: any) {
      setForgotMsg({ error: err.message, success: '' });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-slate-50 to-slate-100 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 w-full max-w-md border border-slate-100"
      >
        <div className="text-center mb-8">
          <img 
            src="/logoADC.png" 
            alt="ADC Logo" 
            className="w-28 h-28 mx-auto mb-3 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = document.getElementById('logo-fallback');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div id="logo-fallback" className="hidden w-16 h-16 bg-emerald-600 text-white rounded-2xl items-center justify-center font-bold text-2xl mx-auto mb-5 shadow-lg shadow-emerald-600/20 rotate-3">
            ADC
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Bienvenue</h1>
          <p className="text-slate-500 mt-1.5 text-xs sm:text-sm">Connectez-vous à votre espace membre</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-xl mb-6 text-xs sm:text-sm flex items-center gap-2 font-bold">
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 ml-1">Téléphone</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-bold text-xs sm:text-sm text-slate-800"
                placeholder="03........"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 ml-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Mot de passe</label>
              <button
                type="button"
                onClick={() => { setShowForgot(true); setForgotStep(1); setForgotMsg({ error: '', success: '' }); }}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
              >
                Mot de passe oublié ?
              </button>
            </div>
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-bold text-xs sm:text-sm text-slate-800"
                placeholder="••••••••"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-70 disabled:cursor-not-allowed mt-2 cursor-pointer active:scale-[0.99]"
          >
            {loading ? 'Connexion en cours...' : (
              <>
                <LogIn size={16} />
                Se connecter
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs font-bold text-slate-500">
          Pas encore membre ?{' '}
          <Link to="/register" className="text-emerald-600 font-extrabold hover:text-emerald-700 hover:underline transition-colors">
            Créer un compte
          </Link>
        </div>
      </motion.div>

      <AnimatePresence>
        {showForgot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
              <button onClick={() => setShowForgot(false)} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-800 rounded-full cursor-pointer">
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">Récupération d'Accès</h3>
                  <p className="text-xs text-slate-400 font-medium">Étape {forgotStep} sur 2</p>
                </div>
              </div>

              {forgotMsg.error && <div className="bg-rose-50 text-rose-600 p-3 rounded-xl mb-4 text-xs font-bold border border-rose-100">{forgotMsg.error}</div>}
              {forgotMsg.success && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl mb-4 text-xs font-bold border border-emerald-100 flex items-center gap-2"><CheckCircle2 size={16}/> {forgotMsg.success}</div>}

              {forgotStep === 1 ? (
                <form onSubmit={handleRequestCode} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Téléphone du compte</label>
                    <input type="tel" placeholder="0340000000" value={forgotPhone} onChange={(e)=>setForgotPhone(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Email associé au compte</label>
                    <input type="email" placeholder="adresse@email.com" value={forgotEmail} onChange={(e)=>setForgotEmail(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500" required />
                  </div>
                  <button type="submit" disabled={forgotLoading} className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all cursor-pointer shadow-md">
                    {forgotLoading ? <Loader2 size={16} className="animate-spin"/> : <>Générer le code <ArrowRight size={14}/></>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Code de confirmation (6 chiffres)</label>
                    <input type="text" maxLength={6} placeholder="Ex: 482910" value={forgotCode} onChange={(e)=>setForgotCode(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono text-base font-black tracking-widest outline-none focus:border-emerald-500" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Nouveau mot de passe</label>
                    <div className="relative">
                      <input 
                        type={showNewPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        value={newPassword} 
                        onChange={(e)=>setNewPassword(e.target.value)} 
                        className="w-full p-3 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500" 
                        required 
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={forgotLoading} className="w-full py-3.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all cursor-pointer shadow-md">
                    {forgotLoading ? <Loader2 size={16} className="animate-spin"/> : 'Valider le nouveau mot de passe'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}