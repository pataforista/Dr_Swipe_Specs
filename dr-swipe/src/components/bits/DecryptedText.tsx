import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  characters?: string;
  className?: string;
  parentClassName?: string;
  animateOn?: 'view' | 'hover';
  revealMultiplier?: number;
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  className = '',
  parentClassName = '',
  animateOn = 'view',
  revealMultiplier = 1,
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (animateOn === 'view') {
      let iteration = 0;
      const targetText = text;

      intervalRef.current = setInterval(() => {
        setDisplayText(() =>
          targetText
            .split('')
            .map((char, index) => {
              if (char === ' ') return ' ';
              if (index < (iteration * revealMultiplier) / maxIterations) return char;
              return characters[Math.floor(Math.random() * characters.length)];
            })
            .join('')
        );

        iteration++;
        if (iteration * revealMultiplier >= targetText.length * maxIterations) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setDisplayText(targetText);
        }
      }, speed);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };

  }, [text, speed, maxIterations, animateOn, characters, revealMultiplier]);

  return (
    <motion.span className={`inline-block whitespace-pre-wrap ${parentClassName}`}>
      <span className={className}>{displayText}</span>
    </motion.span>
  );
}
