import React from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
}

const GlitchText: React.FC<GlitchTextProps> = ({ text, className = "" }) => {
  return (
    <span className={`relative inline-block font-black uppercase ${className}`}>
      <span className="relative z-10">{text}</span>
      <span 
        className="absolute top-0 left-0 w-full h-full text-moomin-accent opacity-70 animate-glitch-before z-0 pointer-events-none"
        aria-hidden="true"
        style={{ textShadow: '2px 0 #FF9F7F' }}
      >
        {text}
      </span>
      <span 
        className="absolute top-0 left-0 w-full h-full text-moomin-secondary opacity-70 animate-glitch-after z-0 pointer-events-none"
        aria-hidden="true"
        style={{ textShadow: '-2px 0 #FFB6C1' }}
      >
        {text}
      </span>
    </span>
  );
};

export default GlitchText;
