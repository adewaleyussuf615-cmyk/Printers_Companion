import React, { useEffect, useState } from 'react';
import logoMark from '../assets/logo-mark.png';

// Splash/welcome screen shown once per browser session.
// Plays a short entrance animation with the real Printers Companion logo,
// then fades out and unmounts to reveal the app underneath.
const WelcomeScreen = ({ onFinish }) => {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const closeTimer = setTimeout(() => setClosing(true), 1700);
    const unmountTimer = setTimeout(() => onFinish(), 2200);
    return () => {
      clearTimeout(closeTimer);
      clearTimeout(unmountTimer);
    };
  }, [onFinish]);

  const handleSkip = () => {
    setClosing(true);
    setTimeout(() => onFinish(), 400);
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#FAFBFC] transition-opacity duration-500 ease-out cursor-pointer ${
        closing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <style>{`
        @keyframes pc-ring {
          0% { transform: scale(0.6); opacity: 0; }
          60% { opacity: 0.35; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes pc-mark-in {
          0% { transform: scale(0.5) rotate(-20deg); opacity: 0; }
          70% { transform: scale(1.08) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes pc-word-in {
          0% { transform: translateY(14px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .pc-ring {
          animation: pc-ring 1.6s cubic-bezier(0.2, 0.6, 0.4, 1) infinite;
        }
        .pc-mark {
          animation: pc-mark-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .pc-word {
          animation: pc-word-in 0.6s ease-out 0.35s both;
        }
      `}</style>

      <div className="relative w-24 h-24 flex items-center justify-center">
        <span className="pc-ring absolute inset-0 rounded-full border-2 border-[#143F8F]" />
        <img
          src={logoMark}
          alt=""
          className="pc-mark relative w-20 h-20 object-contain drop-shadow-sm"
        />
      </div>

      <div className="pc-word mt-5 flex items-center gap-2.5" aria-label="Printers Companion">
        <span className="text-2xl font-extrabold font-display tracking-tight text-[#0B1F3A]">
          Printers <span className="text-[#E53935]">Companion</span>
        </span>
      </div>

      <span className="pc-word mt-3 text-[11px] font-semibold tracking-[0.2em] text-slate-400 uppercase">
        Paper &amp; Board, Sorted
      </span>
    </div>
  );
};

export default WelcomeScreen;
