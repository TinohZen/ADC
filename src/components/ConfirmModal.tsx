import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, CheckCircle2, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  type?: 'danger' | 'success' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmModal({ isOpen, title, message, confirmText = "Confirmer", type = 'info', onConfirm, onCancel, loading }: ConfirmModalProps) {
  const colors = {
    danger: "bg-red-600 hover:bg-red-700 shadow-red-200",
    success: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
    info: "bg-slate-800 hover:bg-slate-900 shadow-slate-200"
  };

  const icons = {
    danger: <AlertCircle size={32} className="text-red-500" />,
    success: <CheckCircle2 size={32} className="text-emerald-500" />,
    info: <Info size={32} className="text-blue-500" />
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden p-8 border border-slate-100"
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-3xl ${type === 'danger' ? 'bg-red-50' : type === 'success' ? 'bg-emerald-50' : 'bg-blue-50'} flex items-center justify-center mb-6`}>
                {icons[type]}
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">{message}</p>
              
              <div className="flex gap-3 w-full">
                <button onClick={onCancel} disabled={loading} className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50">
                  Annuler
                </button>
                <button onClick={onConfirm} disabled={loading} className={`flex-1 px-4 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${colors[type]} disabled:opacity-50`}>
                  {loading && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />}
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}