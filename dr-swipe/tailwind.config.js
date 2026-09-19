/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        'accent-alert': 'var(--accent-alert)',
        medical: {
          primary: 'var(--primary)',
          secondary: 'var(--secondary)',
          danger: 'var(--accent-alert)',
          warning: '#F59E0B',
          info: 'var(--primary)',
          dark: 'var(--bg-app)',
          glass: 'var(--surface)',
        },
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
