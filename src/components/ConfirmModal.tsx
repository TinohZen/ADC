import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, message, confirmText = "OK", type = 'info', onConfirm, onCancel, loading, onlyConfirm }: any) {
  const colors = {
    danger: "bg-red-600 hover:bg-red-700 shadow-red-200 text-white",
    success: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 text-white",
    info: "bg-slate-800 hover:bg-slate-900 shadow-slate-200 text-white"
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-8 text-center border border-white">
            <div className={`w-20 h-20 rounded-[2rem] mx-auto mb-6 flex items-center justify-center ${type === 'danger' ? 'bg-red-50 text-red-500' : type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
              {type === 'danger' ? <AlertCircle size={40}/> : type === 'success' ? <CheckCircle2 size={40}/> : <Info size={40}/>}
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">{title}</h3>
            <p className="text-slate-500 text-sm font-medium mb-8">{message}</p>
            <div className="flex gap-3">
              {!onlyConfirm && <button onClick={onCancel} className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-500 font-bold text-xs uppercase">Annuler</button>}
              <button onClick={onConfirm || onCancel} disabled={loading} className={`flex-1 py-4 rounded-2xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 uppercase ${colors[type as keyof typeof colors]}`}>
                {loading && <Loader2 size={16} className="animate-spin" />}{confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
    </AnimatePresence>
  );
}