import React from 'react';
import type { CSSProperties } from 'react';
import styles from './DoodleButton.module.css';

interface DoodleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export const DoodleButton: React.FC<DoodleButtonProps> = ({ label, ...props }) => {
  return (
    <div className={styles.buttonWrap}>
      <button className={styles.button} {...props}>
        <div className={styles.glow}></div>

        <div className={styles.bg}>
          <div className={styles.shine}></div>
        </div>

        <div className={styles.wave}></div>

        <div className={styles.wrap}>
          <div className={styles.circuit}></div>

          <div className={styles.wrapContent}>
            <div className={styles.content}>
              <div className={styles.outline}></div>

              <div className={styles.glyphs}>
                <span className={styles.text}>
                  {label.split('').map((char, index) => {
                    if (char === ' ') {
                      return <span key={`space-${index}`} className={styles.space} />;
                    }
                    return (
                      <span
                        key={`${index}-${char}`}
                        className={styles.letter}
                        style={{ '--i': index + 3 } as CSSProperties}
                      >
                        {char}
                      </span>
                    );
                  })}
                </span>

                <div className={styles.icon1}></div>
                <div className={styles.icon2}></div>
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};
