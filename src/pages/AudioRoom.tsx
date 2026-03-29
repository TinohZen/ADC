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
  const [isInitializing, setIsInitializing] = useState(true);

  const userStr = localStorage.getItem('adc_user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  // Définition du rôle : Admin/Chef = Hôte, Membre = Auditeur
  const isHost = user?.role === 'admin' || user?.role === 'chef';

  useEffect(() => {
    // Empêche la double connexion qui fait bugger le micro
    if (!roomContainer.current || !user || isJoined.current) return;
    isJoined.current = true;

    const startMeeting = async () => {
      try {
        const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
        const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;
        const roomID = `ADC_Meeting_${id}`;

        // Génération du token
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          roomID,
          String(user.id),
          `${user.first_name} ${user.last_name}`
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        const userRole = isHost 
          ? ZegoUIKitPrebuilt.Host 
          : ZegoUIKitPrebuilt.Audience;

        zp.joinRoom({
          container: roomContainer.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.LiveAudioRoom,
            config: {
              role: userRole,
            },
          },
          // GESTION DE LA PHOTO DE PROFIL
          // Si la photo est une URL (Supabase), on l'envoie. Sinon on met un avatar par défaut.
          userAvatarUrl: user.photo_url && user.photo_url.startsWith('http') 
            ? user.photo_url 
            : `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=10b981&color=fff`,

          // INTERFACE FIXE (Ne se cache plus)
          bottomMenuBarConfig: {
            hideAutomatically: false,
            hideByClick: false,
          },

          showPreJoinView: false,
          showUserList: true,
          showAudioVideoSettingsButton: true,
          turnOnCameraWhenJoining: false,
          showMyCameraToggleButton: false,
          showScreenSharingButton: false,
          
          onLeaveRoom: () => {
            handleExit();
          },
        });
        setIsInitializing(false);
      } catch (error) {
        console.error("Erreur Zego:", error);
      }
    };

    startMeeting();

    return () => {
      if (zpRef.current) {
        zpRef.current.destroy();
        isJoined.current = false;
      }
    };
  }, [id, user, isHost]);

  const handleExit = () => {
    if (zpRef.current) {
      zpRef.current.destroy();
    }
    navigate(`/meetings/${id}`);
  };

  if (!user) return <div className="p-10 text-center font-bold">Accès non autorisé</div>;

  return (
    <div className="fixed inset-0 z-[999] bg-[#1c1f2e] flex flex-col font-sans">
      {/* BARRE DE NAVIGATION (SANS UPPERCASE) */}
      <div className="p-4 bg-[#161925] flex items-center justify-between border-b border-white/5 shadow-2xl z-10">
        <button 
          onClick={handleExit} 
          className="px-4 py-2 bg-white/10 text-white rounded-xl flex items-center gap-2 hover:bg-red-500 transition-all font-bold text-xs"
        >
          <ArrowLeft size={18}/> Quitter la réunion
        </button>
        
        <div className="flex flex-col items-center">
            <h2 className="text-emerald-400 font-bold tracking-wide text-sm sm:text-base">
              Salon vocal ADC
            </h2>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em]">En direct</p>
        </div>
        
        <div className="hidden sm:block w-32"></div>
      </div>
      
      {/* CHARGEMENT */}
      {isInitializing && (
        <div className="absolute inset-0 bg-[#1c1f2e] z-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-emerald-500" size={40} />
            <p className="text-white/50 font-medium text-sm">Connexion au salon vocal...</p>
        </div>
      )}

      {/* ZONE AUDIO */}
      <div ref={roomContainer} className="flex-1 w-full h-full" />
    </div>
  );
}