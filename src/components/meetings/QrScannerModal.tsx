import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  attendance: any[];
  onMarkPresent: (userId: number) => Promise<void>;
}

export default function QrScannerModal({ isOpen, onClose, attendance, onMarkPresent }: Props) {
  const [scanResult, setScanResult] = useState<{ type: 'success' | 'warning' | 'error'; message: string; user?: any } | null>(null);
  const [scannedCount, setScannedCount] = useState(0);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessing = useRef(false);

  const playSuccessBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  };

  useEffect(() => {
    if (!isOpen) return;

    Html5Qrcode.getCameras().then((devices) => {
      if (devices && devices.length) {
        setCameras(devices);
        const backCam = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('arri'));
        setSelectedCameraId(backCam ? backCam.id : devices[0].id);
      }
    }).catch(console.error);

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedCameraId) {
      startScanner(selectedCameraId);
    }
  }, [isOpen, selectedCameraId]);

  const startScanner = async (cameraId: string) => {
    await stopScanner();

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-container');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        cameraId,
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          if (isProcessing.current) return;
          isProcessing.current = true;

          await handleQrCodeDetected(decodedText);

          setTimeout(() => {
            isProcessing.current = false;
          }, 1800);
        },
        () => {}
      );
    } catch (err) {
      console.error(err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
  };

  const handleQrCodeDetected = async (rawCode: string) => {
    let matchedUserId: number | null = null;

    const regexMatches = rawCode.match(/(?:ADC-USER-|verif=|id=)(\d+)/i) || rawCode.match(/(\d+)/);
    if (regexMatches && regexMatches[1]) {
      matchedUserId = Number(regexMatches[1]);
    }

    if (!matchedUserId) {
      setScanResult({ type: 'error', message: 'Badge non reconnu (Format invalide)' });
      return;
    }

    const member = attendance.find((a) => Number(a.id) === matchedUserId || Number(a.user_id) === matchedUserId);

    if (!member) {
      setScanResult({ type: 'error', message: `Matricule #${matchedUserId} non convoqué à cette réunion` });
      return;
    }

    if (member.status === 'present') {
      setScanResult({
        type: 'warning',
        message: `${member.first_name} ${member.last_name} est DÉJÀ enregistré(e) présent(e).`,
        user: member,
      });
      return;
    }

    playSuccessBeep();
    await onMarkPresent(member.id || member.user_id);
    setScannedCount((c) => c + 1);

    setScanResult({
      type: 'success',
      message: `${member.first_name} ${member.last_name} marqué(e) PRÉSENT(E) !`,
      user: member,
    });
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col"
      >
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider">Scanner d'Émargement</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                {scannedCount} adhérent(s) validé(s) par scan
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative bg-slate-950 flex flex-col items-center justify-center overflow-hidden min-h-[320px]">
          <div id="qr-reader-container" className="w-full max-w-[360px] overflow-hidden" />

          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-dashed border-emerald-500/60 rounded-3xl relative overflow-hidden flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.15)]">
              <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-bounce top-0" />
            </div>
          </div>
        </div>

        {cameras.length > 1 && (
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
            <span>Objectif caméra :</span>
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 outline-none text-xs font-semibold cursor-pointer"
            >
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label || `Caméra ${cam.id.substring(0, 5)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="p-6 min-h-[110px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {scanResult ? (
              <motion.div
                key={scanResult.message}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`w-full p-4 rounded-2xl flex items-center gap-3 border ${
                  scanResult.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : scanResult.type === 'warning'
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}
              >
                {scanResult.user?.photo_url && scanResult.user?.photo_url !== 'EMPTY' ? (
                  <img
                    src={scanResult.user.photo_url}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-xs font-bold">
                    {scanResult.type === 'success' ? <CheckCircle2 className="text-emerald-600" size={24} /> : <AlertCircle className="text-amber-600" size={24} />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-xs leading-snug">{scanResult.message}</p>
                  {scanResult.user && (
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                      {scanResult.user.district || scanResult.user.region || 'ADC Madagascar'}
                    </p>
                  )}
                </div>
              </motion.div>
            ) : (
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                Pointez le badge d'un adhérent face à l'objectif pour valider son émargement.
              </p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}