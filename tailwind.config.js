/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ice: {
          950: '#0D0F12', // pozadí
          900: '#161A20', // karty
          850: '#1C2129',
          800: '#232933',
          700: '#2E3542',
          600: '#3B4453',
        },
        ink: {
          DEFAULT: '#F5F7FA', // primární text
          muted: '#9BA3AF', // tlumený text
          faint: '#6B7380',
        },
        // Akcent se mění za běhu přes CSS proměnnou (Nastavení → Vzhled)
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft: 'rgb(var(--accent) / 0.15)',
        },
        danger: '#F0444F',
        warn: '#F5B83D',
        ok: '#34D399',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
        display: ['"Oswald Variable"', '"Inter Variable"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgb(var(--accent) / 0.5), 0 0 24px -4px rgb(var(--accent) / 0.45)',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-10px)' },
          '40%, 80%': { transform: 'translateX(10px)' },
        },
        fade: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        pop: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        shake: 'shake 0.45s ease-in-out',
        pop: 'pop 0.18s ease-out',
        fade: 'fade 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
