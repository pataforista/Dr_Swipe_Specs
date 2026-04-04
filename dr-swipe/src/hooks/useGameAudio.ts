import { Howl } from 'howler';
import { useEffect, useRef } from 'react';

// Organically styled sounds for the Scrapbook aesthetic
const sfx = {
  paperSlideRight: new Howl({ src: ['/sounds/paper-slide.mp3'], volume: 0.6 }),
  paperSlideLeft: new Howl({ src: ['/sounds/paper-slide-alt.mp3'], volume: 0.5 }),
  bubblePop: new Howl({ src: ['/sounds/bubble-pop.mp3'], volume: 0.7 }),
  markerScratch: new Howl({ src: ['/sounds/marker-scratch.mp3'], volume: 0.8 }),
  chimeSuccess: new Howl({ src: ['/sounds/magic-chime.mp3'], volume: 0.7 }),
  alarmTick: new Howl({ src: ['/sounds/clock-tick.mp3'], volume: 0.5, loop: true })
};

export const useGameAudio = () => {
  const alarmId = useRef<number | null>(null);

  const playSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') sfx.paperSlideRight.play();
    else sfx.paperSlideLeft.play();
  };

  const playFeedback = (type: 'correct' | 'wrong') => {
    if (type === 'correct') sfx.bubblePop.play();
    else sfx.markerScratch.play();
  };
  
  const playGacha = () => sfx.chimeSuccess.play();

  const startTriageAlarm = () => {
    if (alarmId.current === null) {
      const id = sfx.alarmTick.play();
      if (id !== null) {
        alarmId.current = id;
      }
    }
  };

  const stopTriageAlarm = () => {
    if (alarmId.current !== null) {
      sfx.alarmTick.stop(alarmId.current);
      alarmId.current = null;
    }
  };

  useEffect(() => {
    return () => stopTriageAlarm();
  }, []);

  return { playSwipe, playFeedback, playGacha, startTriageAlarm, stopTriageAlarm };
};
