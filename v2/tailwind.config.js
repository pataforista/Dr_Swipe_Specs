/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        playful: ['Comic Sans MS', 'Trebuchet MS', 'cursive', 'system-ui'],
      },
      colors: {
        'moomin-primary': '#87CEEB',
        'moomin-secondary': '#FFB6C1',
        'moomin-tertiary': '#98D8C8',
        'moomin-accent': '#FF9F7F',
        'moomin-bg': '#FFF8F0',
        'moomin-text': '#5C4033',
        'moomin-muted': '#9D8280',
      },
    },
  },
  plugins: [],
}
