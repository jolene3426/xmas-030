import React, { useEffect, useRef } from 'react';
import { TreeMorphState } from '../types';

interface OverlayProps {
  treeState: TreeMorphState;
  setTreeState: (state: TreeMorphState) => void;
  onReload: () => void;
}

export const Overlay: React.FC<OverlayProps> = ({ treeState, setTreeState, onReload }) => {
  const isTree = treeState === TreeMorphState.TREE_SHAPE;
  const audioRef = useRef<HTMLAudioElement>(null);
  const bellAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Attempt to play background music on first interaction if not playing
    const playMusic = () => {
        if(audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(e => console.log("Audio play blocked until interaction"));
        }
    }
    window.addEventListener('click', playMusic);
    return () => window.removeEventListener('click', playMusic);
  }, []);

  const handleToggle = () => {
      const newState = isTree ? TreeMorphState.SCATTERED : TreeMorphState.TREE_SHAPE;
      setTreeState(newState);
      
      // If we are exploding (going to SCATTERED), play bell
      if (isTree) {
          if (bellAudioRef.current) {
              bellAudioRef.current.currentTime = 0;
              bellAudioRef.current.play().catch(() => {});
          }
      }
  };

  return (
    <>
      {/* Background Music: We Wish You A Merry Christmas (Jazz/Piano Style) matching the requested vibe */}
      <audio ref={audioRef} loop volume={0.4}>
          <source src="https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Kevin_MacLeod/Jazz_Sampler/Kevin_MacLeod_-_We_Wish_You_a_Merry_Christmas.mp3" type="audio/mpeg" />
      </audio>
      
      {/* Bell Sound Effect */}
      <audio ref={bellAudioRef} volume={0.6}>
          <source src="https://actions.google.com/sounds/v1/cartoon/sleigh_bells.ogg" type="audio/ogg" />
      </audio>

      <style>{`
        @keyframes bell-shake {
          0% { transform: rotate(-45deg); }
          15% { transform: rotate(-25deg); } 
          30% { transform: rotate(-65deg); } 
          45% { transform: rotate(-35deg); }
          60% { transform: rotate(-55deg); }
          75% { transform: rotate(-45deg); }
          100% { transform: rotate(-45deg); }
        }
        .animate-bell-shake {
          animation: bell-shake 1.5s ease-in-out infinite;
          transform-origin: top center;
        }
        .candy-cane-text {
            background: repeating-linear-gradient(
              45deg,
              #ffffff,
              #ffffff 10px,
              #D42426 10px,
              #D42426 20px
            );
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            /* 3D Text Effect */
            text-shadow: 
                2px 2px 0px #d42426, 
                4px 4px 0px #8b0000,
                6px 6px 4px rgba(0,0,0,0.5);
        }
      `}</style>
      
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8 md:p-12 text-center text-white">
        {/* Header (Text removed from here, moved to center) */}
        <header className="flex flex-col items-center gap-2 relative pointer-events-auto">
          <h2 className="font-[Cinzel] text-sm md:text-lg tracking-[0.3em] text-[#b8860b] opacity-90 uppercase">
            Holiday Memoirs
          </h2>
        </header>

        {/* Reload Button - Top Right */}
        <button 
          onClick={onReload}
          className="pointer-events-auto absolute top-8 right-8 text-[#b8860b] hover:text-[#FFD700] transition-colors group flex items-center gap-2"
          title="Regenerate Memories"
        >
            <span className="font-[Cinzel] text-xs tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                New Memories
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 animate-[spin_10s_linear_infinite] group-hover:animate-spin">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
        </button>
        
        {/* Center Title - Pops up when Exploded (NOT Tree state) */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${!isTree ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
            <div className="relative inline-block">
                <h1 className="candy-cane-text font-['Mountains_of_Christmas'] text-6xl md:text-9xl font-bold leading-tight p-4">
                  Xmas vibe is here
                </h1>
                {/* Bell Icon: Counter-clockwise 45deg base rotation */}
                <span className="absolute -top-4 -right-8 text-6xl animate-bell-shake filter drop-shadow-lg grayscale-0">
                  🔔
                </span>
            </div>
        </div>

        <div className="flex-1" />

        {/* Footer / Controls */}
        <footer className="pointer-events-auto flex flex-col items-center gap-6 pb-10">
          <button
            onClick={handleToggle}
            className={`
              relative group overflow-hidden px-12 py-5 
              border border-[#FFD700]/50 transition-all duration-700 ease-out
              bg-[#1a0b05]/60 backdrop-blur-md hover:bg-[#FFD700]/20 hover:border-[#FFD700]
              shadow-[0_0_30px_rgba(0,0,0,0.5)]
            `}
          >
            <span className={`
              font-[Cinzel] text-xl tracking-[0.25em] uppercase transition-colors duration-300
              ${isTree ? 'text-[#FFD700]' : 'text-[#ffebcd]'}
              drop-shadow-lg
            `}>
              {isTree ? 'Click to Explode' : 'Assemble Form'}
            </span>
            
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent opacity-60" />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent opacity-60" />
          </button>

          <p className="font-[Playfair Display] text-xs text-[#d2b48c] italic opacity-60">
             Hold to Pause &bull; Generative AI Memories
          </p>
        </footer>
      </div>
    </>
  );
};