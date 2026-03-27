import React from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
}

const GlitchText: React.FC<GlitchTextProps> = ({ text, className = "" }) => {
  return (
    <span className={`relative inline-block font-black uppercase tracking-tight ${className}`}>
      <span className="relative z-10">{text}</span>
      <span 
        className="absolute top-0 left-0 w-full h-full text-accent-alert opacity-70 animate-glitch-before z-0 pointer-events-none"
        aria-hidden="true"
        style={{ textShadow: '2px 0 #FB7185' }}
      >
        {text}
      </span>
      <span 
        className="absolute top-0 left-0 w-full h-full text-primary opacity-70 animate-glitch-after z-0 pointer-events-none"
        aria-hidden="true"
        style={{ textShadow: '-2px 0 #22D3EE' }}
      >
        {text}
      </span>
    </span>
  );
};

export default GlitchText;
