import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function AudioRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const roomContainer = useRef<HTMLDivElement>(null);
  const zpRef = useRef<any>(null);
  const isJoined = useRef(false);
  const [loading, setLoading] = useState(true);

  const userStr = localStorage.getItem('adc_user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  // Définition des privilèges
  const isPrivileged = user?.role === 'admin' || user?.role === 'chef';

  useEffect(() => {
    // 1. Sécurité anti-doublon (Fixe l'erreur 'publisher already exist')
    if (!roomContainer.current || !user || isJoined.current) return;
    isJoined.current = true;

    const startMeeting = async () => {
      try {
        const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
        const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;
        const roomID = `ADC_Meeting_${id}`;

        // 2. Génération du Token
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          roomID,
          String(user.id),
          `${user.first_name} ${user.last_name}`
        );

        // 3. Création de l'instance Zego
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        // Définition du rôle pour le mode Audio Room
        const role = isPrivileged ? ZegoUIKitPrebuilt.Host : ZegoUIKitPrebuilt.Audience;

        // 4. Rejoindre la salle avec configuration optimisée
        zp.joinRoom({
          container: roomContainer.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.LiveAudioRoom,
            config: {
              role: role,
              addBufferWhenAppointAsSpeaker: true
            },
          },
          // Utilisation de la photo Supabase ou Avatar par défaut
          userAvatarUrl: user.photo_url || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=10b981&color=fff`,
          
          // CONFIGURATION INTERFACE
          showPreJoinView: false, // Entrée directe
          showUserList: true,     // Liste des membres visible
          showAudioVideoSettingsButton: true,
          
          // SÉCURITÉ MICRO (Fixe l'erreur 'cannot start publish')
          // On ne force pas le micro à l'entrée, l'utilisateur l'active manuellement
          turnOnMicrophoneWhenJoining: false, 
          turnOnCameraWhenJoining: false,
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          
          // DROITS DE MODÉRATION (Admin & Chef seulement)
          showTurnOffRemoteMicrophoneButton: isPrivileged, 
          showTurnOffRemoteCameraButton: isPrivileged,
          showRemoveUserButton: isPrivileged,

          // BARRE DE MENU FIXE
          bottomMenuBarConfig: {
            hideAutomatically: false,
            hideByClick: false,
          },

          onLeaveRoom: () => handleExit(),
        });

        setLoading(false);
      } catch (error) {
        console.error("Erreur d'initialisation ZegoCloud:", error);
        setLoading(false);
      }
    };

    startMeeting();

    // 5. NETTOYAGE ABSOLU (S'exécute quand on quitte la page ou l'onglet)
    return () => {
      if (zpRef.current) {
        zpRef.current.destroy();
        zpRef.current = null;
      }
      isJoined.current = false;
    };
  }, [id, user, isPrivileged]);

  const handleExit = () => {
    if (zpRef.current) {
      zpRef.current.destroy();
      zpRef.current = null;
    }
    isJoined.current = false;
    navigate(`/meetings/${id}`);
  };

  if (!user) return <div className="p-10 text-center font-bold">Accès non autorisé</div>;

  return (
    <div className="fixed inset-0 z-[999] bg-[#1a1c2e] flex flex-col font-sans">
      {/* HEADER DU SALON */}
      <div className="p-4 bg-[#111321] flex items-center justify-between border-b border-white/5 shadow-xl z-10">
        <button 
          onClick={handleExit} 
          className="px-5 py-2.5 bg-white/5 text-white rounded-2xl flex items-center gap-2 hover:bg-red-600 transition-all font-bold text-xs border border-white/10"
        >
          <ArrowLeft size={18}/> Quitter la réunion
        </button>
        
        <div className="text-center">
            <h2 className="text-emerald-400 font-bold text-sm sm:text-base tracking-wide">
              Salon vocal ADC
            </h2>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">En direct</p>
        </div>
        
        <div className="hidden sm:block w-32"></div> {/* Équilibre visuel */}
      </div>
      
      {/* ÉCRAN DE CHARGEMENT */}
      {loading && (
        <div className="absolute inset-0 bg-[#1a1c2e] z-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-emerald-500" size={48} />
            <p className="text-emerald-500/50 font-bold text-xs uppercase tracking-widest tracking-tighter">Connexion au flux audio...</p>
        </div>
      )}

      {/* ZONE DE RENDU ZEGO CLOUD */}
      <div ref={roomContainer} className="flex-1 w-full h-full" />
    </div>
  );
}