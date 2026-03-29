import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { ArrowLeft } from 'lucide-react';

export default function AudioRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const roomContainer = useRef<HTMLDivElement>(null);
  
  // Sécurité anti-bug (Empêche la connexion en double)
  const isJoined = useRef(false); 
  const zpRef = useRef<any>(null);

  const userStr = localStorage.getItem('adc_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isHost = user?.role === 'admin' || user?.role === 'chef';

  useEffect(() => {
    if (!roomContainer.current || !user || isJoined.current) return;
    isJoined.current = true;

    const startMeeting = async () => {
      const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
      const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET || "";
      
      if (!appID || !serverSecret) {
        console.error("Clés ZegoCloud manquantes !");
        return;
      }

      const roomID = `ADC_Meeting_${id}`;

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomID,
        String(user.id),
        `${user.first_name} ${user.last_name}`
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zpRef.current = zp;

      // Attribution du Rôle
      const userRole = isHost 
        ? ZegoUIKitPrebuilt.Host     // L'Admin/Chef a le Micro direct
        : ZegoUIKitPrebuilt.Audience; // Le Membre simple a le bouton "Lever la main"

      zp.joinRoom({
        container: roomContainer.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.LiveAudioRoom,
          config: {
            role: userRole,
          },
        },
        
        // 🔥 MAINTENIR LES BOUTONS AFFICHÉS EN PERMANENCE
        bottomMenuBarConfig: {
          hideAutomatically: false, // Ne jamais cacher la barre du bas
          hideByClick: false,       // Empêcher de la cacher en cliquant sur l'écran
        },

        // Réglages du salon
        turnOnCameraWhenJoining: false,
        showMyCameraToggleButton: false, // On cache la vidéo
        showAudioVideoSettingsButton: true,
        showScreenSharingButton: false,
        showUserList: true, // Montre la liste des connectés
        
        // Photo de profil
        userAvatarUrl: user.photo_url || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=10b981&color=fff`,
        
        onLeaveRoom: () => {
          navigate(`/meetings/${id}`);
        },
      });
    };

    startMeeting();

    // Fonction de nettoyage quand on quitte la page
    return () => {
      if (zpRef.current) {
        zpRef.current.destroy();
      }
    };
  }, [id, user, navigate, isHost]);

  // Fonction pour quitter proprement en cliquant sur le bouton du haut
  const handleManualLeave = () => {
    if (zpRef.current) {
      zpRef.current.destroy();
    }
    navigate(`/meetings/${id}`);
  };

  if (!user) return <div>Accès refusé</div>;

  return (
    <div className="fixed inset-0 z-[999] bg-slate-900 flex flex-col font-sans">
      {/* BARRE DU HAUT */}
      <div className="p-4 bg-slate-800 flex items-center justify-between border-b border-slate-700 shadow-xl z-10">
        <button onClick={handleManualLeave} className="px-5 py-3 bg-slate-700 text-white rounded-xl flex items-center gap-2 hover:bg-red-500 transition-all font-black text-xs uppercase tracking-widest shadow-md">
          <ArrowLeft size={16}/> Quitter le salon
        </button>
        <h2 className="text-emerald-400 font-black tracking-[0.2em] uppercase text-xs sm:text-sm">
          SALON VOCAL ADC
        </h2>
        <div className="w-32"></div> {/* Espace pour centrer le titre */}
      </div>
      
      {/* ZONE ZEGO CLOUD */}
      <div ref={roomContainer} className="flex-1 w-full h-full bg-slate-900" />
    </div>
  );
}