/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Channels + <alpha-value>: with a bare var() Tailwind 3 silently drops
      // every opacity variant (bg-primary/10, bg-secondary/90...).
      colors: {
        paper: 'rgb(var(--paper-rgb) / <alpha-value>)',
        ink: 'rgb(var(--ink-rgb) / <alpha-value>)',
        primary: 'rgb(var(--primary-rgb) / <alpha-value>)',
        secondary: 'rgb(var(--secondary-rgb) / <alpha-value>)',
        'accent-alert': 'rgb(var(--accent-alert-rgb) / <alpha-value>)',
      },
      borderRadius: {
        button: 'var(--radius-button)',
        panel: 'var(--radius-panel)',
        container: 'var(--radius-container)',
        dialog: 'var(--radius-dialog)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
    },
  },
  plugins: [],
}
