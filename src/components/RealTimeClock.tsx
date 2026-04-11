import React, { useState, useEffect } from 'react';

export const RealTimeClock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formattedTime = time.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    hour12: false 
  });

  if (isFullscreen) {
    return (
      <div 
        className="fixed inset-0 bg-black flex items-center justify-center z-[9999] cursor-pointer"
        onClick={toggleFullscreen}
      >
        <div className="text-white font-mono font-bold text-[15vw] tracking-wider">
          {formattedTime}
        </div>
      </div>
    );
  }

  return (
    <button 
      onClick={toggleFullscreen}
      className="font-mono text-xl font-bold text-orange-500 hover:text-orange-400 transition-colors px-4 py-1 rounded-md bg-slate-800 border border-slate-700 shadow-inner"
      title="Pantalla completa"
    >
      {formattedTime}
    </button>
  );
};
