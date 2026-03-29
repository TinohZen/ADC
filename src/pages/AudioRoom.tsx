import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { ArrowLeft } from 'lucide-react';

export default function AudioRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const roomContainer = useRef<HTMLDivElement>(null);

  const userStr = localStorage.getItem('adc_user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (!roomContainer.current || !user) return;

    const startMeeting = async (element: HTMLDivElement) => {
      // 1. Récupération des clés (depuis Vercel ou le fichier .env)
      const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
      const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET || "";
      
      if (!appID || !serverSecret) {
        console.error("Clés ZegoCloud manquantes !");
        return;
      }

      // 2. Nom de la salle unique par réunion
      const roomID = `ADC_Meeting_${id}`;

      // 3. Génération du badge d'accès
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomID,
        String(user.id),
        `${user.first_name} ${user.last_name}`
      );

      // 4. Lancement de l'interface ZegoCloud
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zp.joinRoom({
        container: element,
        turnOnCameraWhenJoining: false, // Caméra désactivée par défaut (Audio Room)
        showMyCameraToggleButton: false, // Cache le bouton caméra
        showAudioVideoSettingsButton: true,
        showScreenSharingButton: false,
        showUserList: true,
        maxUsers: 50,
        layout: "Grid",
        showPreJoinView: false, // Entre directement dans le salon
        onLeaveRoom: () => {
          navigate(`/meetings/${id}`); // Retour aux détails de la réunion quand on quitte
        },
      });
    };

    startMeeting(roomContainer.current);
  }, [id, user, navigate]);

  if (!user) return <div>Accès refusé</div>;

  return (
    <div className="fixed inset-0 z-[999] bg-slate-900 flex flex-col font-sans">
      {/* HEADER DU SALON */}
      <div className="p-4 bg-slate-800 flex items-center justify-between border-b border-slate-700 shadow-xl z-10">
        <button onClick={() => navigate(`/meetings/${id}`)} className="px-4 py-2.5 bg-slate-700 text-white rounded-xl flex items-center gap-2 hover:bg-red-500 transition-all font-black text-[10px] uppercase tracking-widest shadow-md">
          <ArrowLeft size={16}/> Quitter
        </button>
        <h2 className="text-white font-black tracking-[0.2em] uppercase text-xs sm:text-sm">SALON VOCAL ADC</h2>
        <div className="w-24"></div> {/* Pour centrer le titre */}
      </div>
      
      {/* ZONE AUDIO ZEGO-CLOUD */}
      <div ref={roomContainer} className="flex-1 w-full h-full bg-slate-900" />
    </div>
  );
}