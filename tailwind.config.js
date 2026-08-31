/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      screens: {
        xs: '480px',
      },
      colors: {
        primary: {
          DEFAULT: '#0D6B4D',
          dark: '#0A523B',
          light: '#E8F5F0',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#FEF9E7',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          hover: '#F5F5F2',
        },
        bg: '#FAF9F6',
        border: {
          DEFAULT: '#E5E7EB',
          light: '#F0F0ED',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans Arabic', 'Rubik', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.04)',
        md: '0 2px 8px rgba(0,0,0,0.06)',
        lg: '0 4px 16px rgba(0,0,0,0.08)',
      },
      maxWidth: {
        reading: '700px',
      },
    },
  },
  plugins: [],
}
