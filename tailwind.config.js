/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        raw: {
          bg: '#0f1115',
          surface: '#161920',
          panel: '#1c202a',
          border: '#292f3d',
          text: '#e6edf3',
          muted: '#8b949e',
          accent: '#6366f1',
          accentHover: '#4f46e5',
          gold: '#eab308',
          success: '#10b981',
          danger: '#ef4444',
          warning: '#f59e0b',
        }
      },
      fontFamily: {
        serif: ['Merriweather', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
