import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cyberpunk palette
        neon: {
          cyan: '#00FFFF',
          magenta: '#FF00FF',
          yellow: '#FFE600',
          green: '#39FF14',
          orange: '#FF6600',
          red: '#FF003C',
        },
        dark: {
          900: '#030308',
          800: '#080812',
          700: '#0D0D1A',
          600: '#12121F',
          500: '#1A1A2E',
        },
        ui: {
          panel: 'rgba(8,8,18,0.95)',
          border: 'rgba(0,255,255,0.2)',
          glow: 'rgba(0,255,255,0.6)',
        },
      },
      fontFamily: {
        display: ['"Orbitron"', 'monospace'],
        body: ['"Rajdhani"', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'glitch': 'glitch 0.3s linear infinite',
        'scanline': 'scanline 8s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'slide-in-left': 'slideInLeft 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'zoom-burst': 'zoomBurst 0.2s ease-out',
        'health-drain': 'healthDrain 0.3s ease-out',
        'shake': 'shake 0.3s cubic-bezier(.36,.07,.19,.97)',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { textShadow: '0 0 4px #00FFFF, 0 0 12px #00FFFF, 0 0 24px #00FFFF' },
          '50%': { textShadow: '0 0 8px #00FFFF, 0 0 24px #00FFFF, 0 0 48px #00FFFF' },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(2px, -2px)' },
          '60%': { transform: 'translate(-1px, 1px)' },
          '80%': { transform: 'translate(1px, -1px)' },
          '100%': { transform: 'translate(0)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        slideInLeft: {
          from: { transform: 'translateX(-100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        zoomBurst: {
          '0%': { transform: 'scale(1.4)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        healthDrain: {
          '0%': { filter: 'brightness(2) saturate(3)' },
          '100%': { filter: 'brightness(1) saturate(1)' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        flicker: {
          '0%': { opacity: '0.97' },
          '5%': { opacity: '0.92' },
          '10%': { opacity: '0.97' },
          '15%': { opacity: '0.94' },
          '100%': { opacity: '0.97' },
        },
      },
      backgroundImage: {
        'cyber-grid': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg stroke='%2300FFFF' stroke-width='0.3' stroke-opacity='0.15'%3E%3Cpath d='M0 0h60v60H0z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'neon-cyan': '0 0 8px rgba(0,255,255,0.6), 0 0 20px rgba(0,255,255,0.3)',
        'neon-magenta': '0 0 8px rgba(255,0,255,0.6), 0 0 20px rgba(255,0,255,0.3)',
        'neon-red': '0 0 8px rgba(255,0,60,0.6), 0 0 20px rgba(255,0,60,0.3)',
        'panel': 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 32px rgba(0,0,0,0.8)',
      },
    },
  },
  plugins: [],
}

export default config
