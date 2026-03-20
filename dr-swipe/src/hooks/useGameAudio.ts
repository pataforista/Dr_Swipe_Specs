import { Howl } from 'howler';
import { useEffect, useRef } from 'react';

// Pre-load sounds for lag-free gaming
const sfx = {
  swipeRight: new Howl({ src: ['/sounds/paper-slide-right.mp3'], volume: 0.6 }),
  swipeLeft: new Howl({ src: ['/sounds/paper-slide-left.mp3'], volume: 0.5 }),
  alarm: new Howl({ src: ['/sounds/red-alert.mp3'], volume: 0.8, loop: true }),
  ghosted: new Howl({ src: ['/sounds/flatline-glitch.mp3'], volume: 1.0 }),
  gachaReveal: new Howl({ src: ['/sounds/magic-chime.mp3'], volume: 0.9 })
};

export const useGameAudio = () => {
  const alarmId = useRef<number | null>(null);

  const playSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') sfx.swipeRight.play();
    else sfx.swipeLeft.play();
  };

  const playGhosted = () => sfx.ghosted.play();
  
  const playGacha = () => sfx.gachaReveal.play();

  const startAlarm = () => {
    if (alarmId.current === null) {
      const id = sfx.alarm.play();
      if (id !== null) {
        alarmId.current = id;
      }
    }
  };

  const stopAlarm = () => {
    if (alarmId.current !== null) {
      sfx.alarm.stop(alarmId.current);
      alarmId.current = null;
    }
  };

  useEffect(() => {
    return () => stopAlarm();
  }, []);

  return { playSwipe, playGhosted, playGacha, startAlarm, stopAlarm };
};
