import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function AudioRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);

  const userStr = localStorage.getItem('adc_user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (!user) return;

    const domain = 'meet.jit.si';
    const roomName = `ADC_REUNION_ROOM_${id}`;

    const loadJitsiScript = () => {
      if ((window as any).JitsiMeetExternalAPI) {
        initJitsi();
      } else {
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = initJitsi;
        document.body.appendChild(script);
      }
    };

    const initJitsi = () => {
      if (!jitsiContainerRef.current) return;
      jitsiContainerRef.current.innerHTML = '';

      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: `${user.first_name} ${user.last_name} (${user.role.toUpperCase()})`,
          email: user.email || undefined,
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: true,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone', 'security'
          ],
        },
      };

      const api = new (window as any).JitsiMeetExternalAPI(domain, options);

      api.addEventListeners({
        videoConferenceLeft: () => {
          navigate(`/meetings/${id}`);
        },
      });
    };

    loadJitsiScript();

    return () => {
      if (jitsiContainerRef.current) {
        jitsiContainerRef.current.innerHTML = '';
      }
    };
  }, [id, user]);

  return (
    <div className="fixed inset-0 z-[999] bg-slate-950 flex flex-col font-sans">
      <div className="p-3.5 bg-slate-900 flex items-center justify-between border-b border-slate-800 z-10">
        <button 
          onClick={() => navigate(`/meetings/${id}`)}
          className="px-4 py-2 bg-white/10 hover:bg-rose-600 text-white rounded-xl flex items-center gap-2 font-bold text-xs transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Quitter le salon
        </button>
        <div className="text-center">
          <h2 className="text-emerald-400 font-black text-xs sm:text-sm tracking-wide uppercase">Salon Vocal & Vidéo ADC</h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">En direct • Réunion #{id}</p>
        </div>
        <div className="w-24 hidden sm:block"></div>
      </div>

      <div ref={jitsiContainerRef} className="flex-1 w-full h-full bg-slate-950" />
    </div>
  );
}