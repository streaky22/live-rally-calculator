import React, { useState, useEffect } from 'react';

export const OverlayClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    hour12: false 
  });

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-transparent">
      <div className="text-white font-mono font-bold text-[15vw] tracking-wider drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]" style={{ WebkitTextStroke: '2px black' }}>
        {formattedTime}
      </div>
    </div>
  );
};
