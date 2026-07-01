import React from 'react';
import styles from './DoodlePlayerCard.module.css';

interface DoodlePlayerCardProps {
  name: string;
  role: string;
  children?: React.ReactNode;
}

export const DoodlePlayerCard: React.FC<DoodlePlayerCardProps> = ({ name, role, children }) => {
  return (
    <div className={styles.card}>
      <svg className={`${styles.doodle} ${styles.star}`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15 9L22 10L17 15L18.5 22L12 18.5L5.5 22L7 15L2 10L9 9L12 2Z"></path>
      </svg>
      <svg className={`${styles.doodle} ${styles.sparkle}`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C12 6.6 17.4 12 24 12C17.4 12 12 17.4 12 24C12 17.4 6.6 12 0 12C6.6 12 12 6.6 12 0Z"></path>
      </svg>
      <svg className={`${styles.doodle} ${styles.swirl}`} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 10C27.9 10 10 27.9 10 50C10 72.1 27.9 90 50 90C72.1 90 90 72.1 90 50C90 32.3 75.7 18 58 18C44.3 18 33 29.3 33 43C33 53.5 41.5 62 52 62C59.7 62 66 55.7 66 48"></path>
      </svg>

      <div className={styles.photo}></div>

      <div className={styles.title}>
        {name}<br />
        <span className={styles.roleBadge}>{role}</span>
      </div>

      {children && (
        <div className={styles.contentArea}>
          {children}
        </div>
      )}
    </div>
  );
};
