/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{svelte,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#08090c',
          panel: '#101217',
          surface: '#171a21',
          border: '#232733',
          borderLight: '#323849',
          muted: '#5e667a',
          text: '#e1e7f5',
          textBright: '#ffffff',
        },
        bull: {
          DEFAULT: '#00f59b',
          glow: 'rgba(0, 245, 155, 0.35)',
          dark: '#00a86b',
        },
        bear: {
          DEFAULT: '#ff2e63',
          glow: 'rgba(255, 46, 99, 0.35)',
          dark: '#c71545',
        },
        neon: {
          cyan: '#00e5ff',
          amber: '#ffd166',
          purple: '#b5179e',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { filter: 'drop-shadow(0 0 5px rgba(0, 229, 255, 0.4))' },
          '100%': { filter: 'drop-shadow(0 0 15px rgba(0, 229, 255, 0.8))' },
        },
      },
    },
  },
  plugins: [],
};
