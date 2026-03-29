import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { ArrowLeft } from 'lucide-react';

export default function AudioRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const roomContainer = useRef<HTMLDivElement>(null);
  
  // 🔥 CORRECTION DU BUG CONSOLE : Empêche le double-chargement du micro
  const isJoined = useRef(false); 

  const userStr = localStorage.getItem('adc_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const canManage = user?.role === 'admin' || user?.role === 'chef';

  useEffect(() => {
    if (!roomContainer.current || !user || isJoined.current) return;
    isJoined.current = true;

    const startMeeting = async (element: HTMLDivElement) => {
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

      // Attribution stricte des rôles pour forcer la "Main Levée"
      const userRole = canManage 
        ? ZegoUIKitPrebuilt.Host     // L'Admin a tous les droits
        : ZegoUIKitPrebuilt.Audience; // Le Membre est muet par défaut et doit lever la main

      zp.joinRoom({
        container: element,
        
        // 🔥 CORRECTION DES PHOTOS : On envoie l'URL de la photo ADC
        userAvatarUrl: user.photo_url || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=10b981&color=fff`,
        
        scenario: {
          mode: ZegoUIKitPrebuilt.LiveAudioRoom,
          config: {
            role: userRole,
          },
        },
        
        // Droits exclusifs Admin / Chef
        showTurnOffRemoteMicrophoneButton: canManage, 
        showRemoveUserButton: canManage,
        
        showPreJoinView: false,
        showUserList: true,
        onLeaveRoom: () => {
          navigate(`/meetings/${id}`);
        },
      });
    };

    startMeeting(roomContainer.current);

    // Nettoyage quand on quitte la page
    return () => {
      isJoined.current = false;
    };
  }, [id, user, navigate, canManage]);

  if (!user) return <div>Accès refusé</div>;

  return (
    <div className="fixed inset-0 z-[999] bg-slate-900 flex flex-col font-sans">
      <div className="p-4 bg-slate-800 flex items-center justify-between border-b border-slate-700 shadow-xl z-10">
        <button onClick={() => navigate(`/meetings/${id}`)} className="px-4 py-2.5 bg-slate-700 text-white rounded-xl flex items-center gap-2 hover:bg-red-500 transition-all font-black text-[10px] uppercase tracking-widest shadow-md">
          <ArrowLeft size={16}/> Quitter
        </button>
        <h2 className="text-emerald-400 font-black tracking-[0.2em] uppercase text-xs sm:text-sm">
          SALON VOCAL ADC
        </h2>
        <div className="w-24"></div>
      </div>
      <div ref={roomContainer} className="flex-1 w-full h-full bg-slate-900" />
    </div>
  );
}