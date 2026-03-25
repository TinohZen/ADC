import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Lock, Camera, Save, Key } from 'lucide-react';
import { motion } from 'motion/react';
import { apiFetch } from '../lib/apiFetch';
export default function Profile() {
  const userStr = localStorage.getItem('adc_user');
  const initialUser = userStr ? JSON.parse(userStr) : null;

  const [formData, setFormData] = useState({
    first_name: initialUser?.first_name || '',
    last_name: initialUser?.last_name || '',
    phone: initialUser?.phone || '',
    email: initialUser?.email || '',
    photo_url: initialUser?.photo_url || ''
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await apiFetch(`/api/users/${initialUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Erreur lors de la mise à jour');

      const updatedUser = { ...initialUser, ...formData };
      localStorage.setItem('adc_user', JSON.stringify(updatedUser));
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas' });
      return;
    }

    setPassLoading(true);
    setMessage({ type: '', text: '' });

    const res = await apiFetch(`/api/users/${initialUser.id}`, { // On a mis apiFetch ici !
      method: 'PUT',
      body: JSON.stringify(formData), // Note: on a retiré le headers: {'Content-Type'...} car apiFetch le fait déjà
    });

    if (!res.ok) throw new Error('Erreur lors de la mise à jour');
    
    const data = await res.json(); // NOUVEAU : on lit la réponse

    // NOUVEAU : On met à jour avec l'URL renvoyée par Supabase
    const updatedUser = { ...initialUser, ...formData, photo_url: data.photo_url }; 
    localStorage.setItem('adc_user', JSON.stringify(updatedUser));
    setFormData(prev => ({ ...prev, photo_url: data.photo_url })); // On met à jour l'affichage
    setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Mon Profil</h2>
        <p className="text-slate-500 text-sm mt-1">Gérez vos informations personnelles et votre sécurité</p>
      </div>

      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl text-sm font-medium ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <User size={20} className="text-emerald-600" />
              Informations Personnelles
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="flex justify-center mb-8">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-full bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden group-hover:border-emerald-400 transition-colors">
                    {formData.photo_url ? (
                      <img src={formData.photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="h-10 w-10 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-emerald-600 p-2.5 rounded-full text-white cursor-pointer hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/30">
                    <Camera size={18} />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Prénom</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Téléphone</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-6 rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-70"
                >
                  <Save size={18} />
                  {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Key size={20} className="text-emerald-600" />
              Sécurité
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe actuel</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwords.currentPassword}
                    onChange={handlePassChange}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nouveau mot de passe</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handlePassChange}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmer le mot de passe</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handlePassChange}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={passLoading}
                className="w-full flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-md shadow-slate-800/20 disabled:opacity-70 mt-2"
              >
                {passLoading ? 'Modification...' : 'Changer le mot de passe'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
