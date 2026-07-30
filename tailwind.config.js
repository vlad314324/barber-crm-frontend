/** @type {import('tailwindcss').Config} */
const withOpacity = (varName) => `rgb(var(${varName}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: withOpacity('--color-canvas'),
          soft: withOpacity('--color-canvas-soft'),
        },
        surface: withOpacity('--color-surface'),
        ink: {
          DEFAULT: withOpacity('--color-ink'),
          secondary: withOpacity('--color-ink-secondary'),
          muted: withOpacity('--color-ink-muted'),
        },
        brand: {
          DEFAULT: withOpacity('--color-brand'),
          dark: withOpacity('--color-brand-dark'),
          soft: withOpacity('--color-brand-soft'),
          'extra-soft': withOpacity('--color-brand-extra-soft'),
        },
        line: {
          DEFAULT: withOpacity('--color-line'),
          medium: withOpacity('--color-line-medium'),
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '14px',
        lg: '20px',
        xl: '28px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(31, 36, 32, 0.04)',
        sm: '0 2px 6px rgba(31, 36, 32, 0.05), 0 1px 2px rgba(31, 36, 32, 0.04)',
        DEFAULT: '0 2px 6px rgba(31, 36, 32, 0.05), 0 1px 2px rgba(31, 36, 32, 0.04)',
        md: '0 8px 24px rgba(31, 36, 32, 0.06), 0 2px 6px rgba(31, 36, 32, 0.04)',
        lg: '0 20px 48px rgba(31, 36, 32, 0.08), 0 4px 12px rgba(31, 36, 32, 0.05)',
        brand: '0 8px 24px rgba(47, 143, 107, 0.18)',
      },
    },
  },
  plugins: [],
};
