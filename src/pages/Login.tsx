import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur de connexion');
      }

      if (data.user.status === 'pending') {
        throw new Error('Votre compte est en attente de validation par un administrateur.');
      }
      if (data.user.status === 'rejected') {
        throw new Error('Votre compte a été refusé.');
      }

      localStorage.setItem('adc_user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-bold text-2xl mx-auto mb-5 shadow-lg shadow-emerald-600/20 rotate-3 hover:rotate-0 transition-transform">
            ADC
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Bienvenue</h1>
          <p className="text-slate-500 mt-2 text-sm">Connectez-vous à votre espace membre</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-xl mb-6 text-sm flex items-center gap-2">
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Téléphone</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                placeholder="0600000000"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Connexion en cours...' : (
              <>
                <LogIn size={20} />
                Se connecter
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          Pas encore membre ?{' '}
          <Link to="/register" className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline transition-colors">
            Créer un compte
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
