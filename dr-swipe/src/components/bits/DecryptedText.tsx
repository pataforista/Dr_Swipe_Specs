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
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  className = '',
  parentClassName = '',
  animateOn = 'view',
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isRevealed, setIsRevealed] = useState(false);
  const intervalRef = useRef<any>(null);

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
              if (index < iteration / maxIterations) return char;
              return characters[Math.floor(Math.random() * characters.length)];
            })
            .join('')
        );

        iteration++;
        if (iteration >= targetText.length * maxIterations) {
          if (intervalRef.current) { // Clear interval only if it exists
            clearInterval(intervalRef.current);
          }
          setDisplayText(targetText);
          // setIsRevealed(true); // Uncomment if isRevealed is used
        }
      }, speed);
    }
    return () => clearInterval(intervalRef.current);
  }, [text, speed, maxIterations, animateOn, characters]);

  return (
    <motion.span className={`inline-block whitespace-pre-wrap ${parentClassName}`}>
      <span className={className}>{displayText}</span>
    </motion.span>
  );
}
