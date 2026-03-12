/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        qfc: {
          bg: '#0a1628',
          'bg-light': '#0d2847',
          'bg-card': '#112240',
          primary: '#4fc3f7',
          accent: '#0288d1',
          text: '#e0f7fa',
          muted: '#90caf9',
          border: '#1e3a5f',
        },
      },
    },
  },
  plugins: [],
};
