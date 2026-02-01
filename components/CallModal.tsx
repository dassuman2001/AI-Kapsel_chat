import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2 } from 'lucide-react';

const CallModal: React.FC = () => {
  const { activeCall, endCall, toggleCallType, currentUser } = useApp();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (activeCall && localVideoRef.current) {
      // Request camera access
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error("Error accessing media devices:", err));
    }
    
    return () => {
        // Cleanup stream tracks if needed
        if(localVideoRef.current && localVideoRef.current.srcObject) {
            const stream = localVideoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [activeCall]);

  if (!activeCall) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/10 border border-slate-800">
        
        {/* Remote Video (Placeholder for simulation) */}
        <div className="absolute inset-0 flex items-center justify-center">
            {activeCall.status === 'connected' ? (
                 activeCall.type === 'video' ? (
                     <div className="text-center">
                         <img 
                            src={`https://picsum.photos/800/600?random=100`} 
                            className="w-full h-full object-cover opacity-80" 
                            alt="Remote"
                         />
                     </div>
                 ) : (
                     <div className="flex flex-col items-center gap-4 animate-pulse">
                         <div className="w-32 h-32 rounded-full bg-indigo-600 flex items-center justify-center text-4xl font-bold">
                             User
                         </div>
                         <h3 className="text-2xl font-semibold">Audio Call Connected...</h3>
                     </div>
                 )
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-slate-700 animate-ping"></div>
                    <p className="text-xl">Calling...</p>
                </div>
            )}
        </div>

        {/* Local Video (PiP) */}
        {activeCall.type === 'video' && (
            <div className="absolute top-4 right-4 w-32 md:w-48 aspect-video bg-black rounded-lg border border-slate-700 shadow-lg overflow-hidden">
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform -scale-x-100" />
            </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md p-4 rounded-3xl border border-white/10">
            <button 
                onClick={() => setMicOn(!micOn)}
                className={`p-4 rounded-full transition-all ${micOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500 text-white'}`}
            >
                {micOn ? <Mic size={24} /> : <MicOff size={24} />}
            </button>
            
            <button 
                onClick={toggleCallType}
                className={`p-4 rounded-full transition-all ${activeCall.type === 'video' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-700 text-slate-400'}`}
            >
                {activeCall.type === 'video' ? <Video size={24} /> : <VideoOff size={24} />}
            </button>

            <button 
                onClick={endCall}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg shadow-red-600/40"
            >
                <PhoneOff size={24} />
            </button>
        </div>
        
        <div className="absolute top-4 left-4">
             <span className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-sm font-mono border border-red-500/30 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                 {activeCall.status === 'connected' ? "00:42" : activeCall.status}
             </span>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
