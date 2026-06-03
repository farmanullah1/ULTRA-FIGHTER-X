import React, { useEffect } from 'react'

export const OrientationGuard: React.FC = () => {
  useEffect(() => {
    const lockLandscape = async () => {
      try {
        if (screen.orientation && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape')
        }
      } catch (e) {
        // Fail silently if unsupported (e.g. desktop browsers, iOS Safari)
      }
    }

    window.addEventListener('click', lockLandscape)
    window.addEventListener('touchstart', lockLandscape)
    return () => {
      window.removeEventListener('click', lockLandscape)
      window.removeEventListener('touchstart', lockLandscape)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[99999] bg-dark-900/98 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none pointer-events-auto sm:hidden portrait:flex landscape:hidden">
      {/* Immersive Cyberpunk Grid background */}
      <div className="absolute inset-0 pointer-events-none bg-cyber-grid opacity-10" />
      
      {/* Scanline */}
      <div className="absolute inset-0 pointer-events-none bg-scanline opacity-30" />

      {/* Warning badge */}
      <div className="flex items-center gap-2 mb-8 animate-pulse">
        <div className="w-2.5 h-2.5 rounded-full bg-neon-red shadow-[0_0_8px_#FF003C]" />
        <span className="text-neon-red text-xs font-mono tracking-[0.35em] uppercase font-black">SYSTEM ADVISORY</span>
      </div>

      {/* Dynamic Animated Rotation SVG Icon */}
      <div className="relative w-36 h-36 flex items-center justify-center mb-8 bg-white/5 border border-white/10 rounded-full shadow-2xl">
        <div className="absolute inset-0 rounded-full border border-dashed border-neon-cyan/20 animate-spin" style={{ animationDuration: '12s' }} />
        <svg 
          className="w-16 h-16 rotate-phone-animation text-neon-cyan drop-shadow-[0_0_12px_rgba(0,255,255,0.5)]" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <path d="M12 18h.01" />
        </svg>
      </div>

      {/* Main Text */}
      <h2 className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-white to-neon-magenta italic tracking-tighter mb-4 uppercase drop-shadow-glow">
        ROTATE DEVICE
      </h2>
      
      <p className="text-sm font-body text-white/70 max-w-xs leading-relaxed mb-10">
        Combat systems and widescreen 3D projection require horizontal (landscape) view. Please rotate your phone.
      </p>

      {/* Corner borders visual frame decoration */}
      <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-neon-cyan/35" />
      <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-neon-cyan/35" />
      <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-neon-cyan/35" />
      <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-neon-cyan/35" />
    </div>
  )
}
