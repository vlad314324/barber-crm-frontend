/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#FAFAF7',
          soft: '#F4F3EF',
        },
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#1F2420',
          secondary: '#5F665F',
          muted: '#8A918A',
        },
        brand: {
          DEFAULT: '#2F8F6B',
          dark: '#17694C',
          soft: '#E5F5EE',
          'extra-soft': '#F1FAF5',
        },
        line: {
          DEFAULT: '#DEDED8',
          medium: '#C9CBC4',
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
