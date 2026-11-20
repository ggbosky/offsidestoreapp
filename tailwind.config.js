/** @type {import('tailwindcss').Config} */
// Barvy převzaté z offsidestore.cz: černé pozadí, červená #EC0016, tmavě červený přechod #B01E28 → #340A0E
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#050505',
        surface: { DEFAULT: '#111111', 2: '#16161A', 3: '#1D1D22' },
        line: { DEFAULT: '#232327', 2: '#3A3A40' },
        ink: { DEFAULT: '#FFFFFF', muted: '#A3A3AA', faint: '#6B6B72' },
        muted: '#A3A3AA',
        faint: '#6B6B72',
        brand: { DEFAULT: '#EC0016', deep: '#B01E28', burgundy: '#340A0E' },
        ok: '#2FBF71',
        warn: '#F2C300',
        sky: '#3FA9E0',
        orange: '#FF6B00',
        danger: '#FF3B4E',
      },
      fontFamily: {
        sans: ['"Assistant Variable"', 'Assistant', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 10px 30px -18px rgba(0,0,0,0.9)',
        glow: '0 8px 24px -8px rgba(236,0,22,0.55)',
      },
      keyframes: {
        shake: { '0%, 100%': { transform: 'translateX(0)' }, '20%, 60%': { transform: 'translateX(-10px)' }, '40%, 80%': { transform: 'translateX(10px)' } },
        pop: { '0%': { transform: 'scale(0.97)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        fade: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
      animation: { shake: 'shake 0.45s ease-in-out', pop: 'pop 0.16s ease-out', fade: 'fade 0.2s ease-out' },
    },
  },
  plugins: [],
};
