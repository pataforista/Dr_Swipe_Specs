import React from 'react';
import styles from './DoodleToggle.module.css';

interface DoodleToggleProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export const DoodleToggle: React.FC<DoodleToggleProps> = ({ id, checked, onChange, label }) => {
  return (
    <div className={styles.wrapper}>
      <label className={styles.button} htmlFor={id}>
        <input
          id={id}
          className={styles.input}
          name={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={styles.socket}></div>
        <div className={styles.lightBulb}>
          <svg fill="none" viewBox="0 0 131 151" xmlns="http://www.w3.org/2000/svg">
            <path
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
              stroke="currentColor"
              d="M1.00043 50.4999C80.0004 57.4999 102 50.4999 102 50.4999C102 50.4999 125 45.9999 127 31.4999C129 16.9998 115 1.49988 107.5 3.49988C100 5.49988 83.5004 16.9999 83.5004 75.4999C83.5004 83.9786 83.8466 91.4701 84.4622 98.0884M1 100.5C43.5028 96.7338 69.5067 97.0201 84.4622 98.0884M84.4622 98.0884C97.3045 99.0058 102 100.5 102 100.5C102 100.5 125 105 127 119.5C129 134 115 149.5 107.5 147.5C101.087 145.79 88.0938 137.134 84.4622 98.0884Z"
            ></path>
          </svg>
          <p className={styles.textLightBulb}>{label}</p>
        </div>
      </label>
    </div>
  );
};
