/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0A0A0B', // near-black background
          soft: '#141416',
          card: '#161618',
          line: '#26262A'
        },
        warm: {
          white: '#F5F0E8', // warm white typography
          mute: '#A5A29B',
          faint: '#6E6B65'
        },
        signal: {
          DEFAULT: '#FF5C38', // one vivid accent
          soft: '#FF7A5C',
          deep: '#E64420'
        }
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        card: '1.75rem'
      },
      keyframes: {
        pulsering: {
          '0%': { transform: 'scale(0.6)', opacity: '0.7' },
          '100%': { transform: 'scale(2.2)', opacity: '0' }
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        pulsering: 'pulsering 2.4s ease-out infinite',
        rise: 'rise 0.5s cubic-bezier(0.22,1,0.36,1) both'
      }
    }
  },
  plugins: []
}
