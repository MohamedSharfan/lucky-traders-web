import type { Config } from 'tailwindcss';

/**
 * Brand palette for Lucky Traders.
 * White dominates; red drives action/sales; blue carries trust/navigation.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#D71920',
          redDark: '#B51218',
          redSoft: '#FDECEC',
          blue: '#0057B8',
          blueDark: '#003B7A',
          blueSoft: '#EAF2FC',
        },
        surface: '#FFFFFF',
        canvas: '#F7F8FA',
        ink: '#222222',
        muted: '#6B7280',
        line: '#E5E7EB',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.05), 0 1px 3px rgba(16,24,40,.06)',
        pop: '0 8px 24px rgba(16,24,40,.10)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in .18s ease-out',
        'slide-up': 'slide-up .2s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
