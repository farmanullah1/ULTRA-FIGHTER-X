import React, { useState, useEffect } from 'react'
import { useGameStore } from '@stores/gameStore'
import { useSettingsStore } from '@stores/settingsStore'
import { HealthBar } from '../ui/HealthBar'
import { RoundTimer } from '../ui/RoundTimer'
import { MeterBar } from '../ui/MeterBar'
import { CHARACTERS } from '@constants/characters'
import type { CharacterDef } from '@game-types/character.types'
import { motion, AnimatePresence } from 'framer-motion'

export const HUD: React.FC = () => {
  const { 
    player1Health, player2Health, 
    player1Meter, player2Meter,
    player1CharId, player2CharId,
    player1Status, player2Status,
    superFlash,
    roundTimeLeft, battleState,
    player1Combo, player2Combo,
    currentRound, roundsWon,
    gameMode, dummyMode, setDummyMode,
    trainingRefill, setTrainingRefill,
    p1FrameAdvantage, p2FrameAdvantage,
    punishAlert, customBannerText
  } = useGameStore()

  const { showHitboxes, toggleHitboxes } = useSettingsStore()
  const [isMobile, setIsMobile] = useState(false)

  // Responsive mobile capability detector
  useEffect(() => {
    const checkMobile = () => {
      const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const smallScreen = window.innerWidth < 1024
      setIsMobile(touchSupport || smallScreen)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const p1Def = CHARACTERS.find((c: CharacterDef) => c.id === player1CharId) || CHARACTERS[0]
  const p2Def = CHARACTERS.find((c: CharacterDef) => c.id === player2CharId) || CHARACTERS[1]

  const handleTouch = (action: string, pressed: boolean) => {
    if ((window as any).triggerVirtualInput) {
      (window as any).triggerVirtualInput(action, pressed)
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none p-4 md:p-6 flex flex-col items-center select-none justify-between h-full">
      {/* KO Vignette overlay */}
      <AnimatePresence>
        {battleState === 'ko' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 pointer-events-none z-0"
            style={{
              background: 'radial-gradient(circle, rgba(0,0,0,0) 30%, rgba(255,0,0,0.45) 85%, rgba(0,0,0,0.85) 100%)',
              mixBlendMode: 'multiply'
            }}
          />
        )}
      </AnimatePresence>

      {/* Super Move Freeze Frame white flash & Kanji overlay */}
      <AnimatePresence>
        {superFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center bg-white"
          >
            {/* Massive Glowing Neon Calligraphy Kanji "滅" (Metsu) - Annihilate */}
            <motion.div
              initial={{ scale: 0.4, rotate: -15, opacity: 0 }}
              animate={{ scale: [0.4, 1.2, 1], rotate: [-15, 5, 0], opacity: 1 }}
              exit={{ scale: 1.8, filter: 'blur(15px)', opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-72 h-72 md:w-96 md:h-96 flex items-center justify-center"
            >
              <svg className="w-full h-full text-neon-red fill-current drop-shadow-[0_0_35px_rgba(255,0,60,0.95)]" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 25C15 25 35 25 35 20H45V30H15V25ZM15 45H45V50H15V45ZM20 60C20 60 40 60 40 55H50V65H20V60ZM48 15H85V23H60V38H80V45H60V55H85V63H48V15ZM25 75C25 85 45 92 75 92V82C55 82 35 78 35 75H25Z" stroke="#FFFFFF" strokeWidth="2" />
              </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Phase Banner Overlay */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden z-20">
        <AnimatePresence>
          {battleState === 'starting' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6, y: 150 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 2, filter: 'blur(10px)' }}
              transition={{ type: 'spring', damping: 15 }}
              className="flex flex-col items-center bg-black/45 px-12 md:px-16 py-8 md:py-10 border-y-2 border-neon-cyan/50 backdrop-blur-md -skew-x-12 mx-4 animate-flicker"
            >
              <motion.span className="text-xl md:text-3xl font-display text-neon-cyan tracking-[0.6em] mb-2 font-black italic drop-shadow-glow">
                {currentRound >= 3 ? 'FINAL ROUND' : `ROUND ${currentRound}`}
              </motion.span>
              <motion.h2 className="text-5xl md:text-8xl font-display font-black text-white italic tracking-tighter drop-shadow-glow">
                READY?
              </motion.h2>
            </motion.div>
          )}
          {battleState === 'active' && roundTimeLeft > 97 && (
            <motion.div
              initial={{ scale: 3, opacity: 0, rotateX: 90 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0, opacity: 0, filter: 'blur(5px)' }}
              transition={{ duration: 0.3 }}
              className="text-7xl md:text-9xl font-display font-black text-neon-magenta italic tracking-tighter drop-shadow-glow"
            >
              FIGHT!
            </motion.div>
          )}
          {battleState === 'ko' && (
            <motion.div
              initial={{ x: -1200, skewX: -20 }}
              animate={{ x: 0, skewX: -20 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="bg-neon-red text-white text-6xl md:text-9xl font-display font-black px-16 md:px-32 py-4 md:py-6 italic shadow-2xl border-l-8 border-white drop-shadow-glow"
            >
              K. O.
            </motion.div>
          )}
          {battleState === 'round-end' && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 60 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              className="flex flex-col items-center gap-3 md:gap-5 bg-black/90 p-6 md:p-10 rounded-2xl border border-white/15 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,255,255,0.18)] max-w-sm md:max-w-md w-full mx-4"
            >
              {/* Winner tag */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="-skew-x-6 bg-neon-cyan/20 border border-neon-cyan/50 px-6 py-1 text-neon-cyan font-mono text-xs tracking-[0.5em] font-black"
              >
                WINNER
              </motion.div>

              {/* Character portrait */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="relative w-40 h-40 md:w-48 md:h-48 rounded-xl overflow-hidden border-2 border-white/20"
                style={{ background: `radial-gradient(circle, ${player1Health > player2Health ? p1Def.colors.primary : p2Def.colors.primary}22 0%, #000 100%)` }}
              >
                <img
                  src={`/assets/images/characters/${(player1Health > player2Health ? p1Def : p2Def).id.replace(/-/g, '_')}.png`}
                  alt={(player1Health > player2Health ? p1Def : p2Def).name}
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-black to-transparent" />
              </motion.div>

              {/* Winner name */}
              <motion.h2
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-6xl font-display font-black text-white italic tracking-tighter drop-shadow-glow text-center"
                style={{ color: player1Health > player2Health ? p1Def.colors.primary : p2Def.colors.primary }}
              >
                {player1Health > player2Health ? p1Def.name : p2Def.name}
              </motion.h2>
              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-lg md:text-2xl font-display font-black text-white/80 italic tracking-widest text-center"
              >
                ROUND VICTORY
              </motion.h3>

              {/* Round dots summary */}
              <div className="flex gap-6 items-center mt-1">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-mono text-white/40 tracking-widest">P1</span>
                  <div className="flex gap-1.5">
                    <div className={`w-3.5 h-3.5 rounded-full border ${roundsWon.player1 >= 1 ? 'bg-neon-cyan border-white' : 'border-white/20'}`} />
                    <div className={`w-3.5 h-3.5 rounded-full border ${roundsWon.player1 >= 2 ? 'bg-neon-cyan border-white' : 'border-white/20'}`} />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-mono text-white/40 tracking-widest">P2</span>
                  <div className="flex gap-1.5">
                    <div className={`w-3.5 h-3.5 rounded-full border ${roundsWon.player2 >= 1 ? 'bg-neon-magenta border-white' : 'border-white/20'}`} />
                    <div className={`w-3.5 h-3.5 rounded-full border ${roundsWon.player2 >= 2 ? 'bg-neon-magenta border-white' : 'border-white/20'}`} />
                  </div>
                </div>
              </div>

              {/* Match result buttons */}
              <div className="flex gap-3 mt-2 pointer-events-auto">
                <button 
                  onClick={() => useGameStore.getState().startNewMatch()}
                  className="px-6 md:px-10 py-2.5 md:py-3 bg-neon-cyan text-dark-900 font-display text-base md:text-xl font-black italic hover:bg-white hover:shadow-neon-cyan transition-all duration-200 clip-corner-both cursor-pointer"
                >
                  REMATCH
                </button>
                <button 
                  onClick={() => { useGameStore.getState().resetMatch(); useGameStore.getState().setScreen('main-menu'); }}
                  className="px-4 md:px-6 py-2.5 md:py-3 bg-white/5 border border-white/15 text-white font-display text-base md:text-xl font-black italic hover:bg-white/10 transition-all duration-200 clip-corner-both cursor-pointer"
                >
                  MENU
                </button>
              </div>
            </motion.div>
          )}
          {customBannerText && (
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -5 }}
              animate={{ scale: 1.1, opacity: 1, rotate: -5 }}
              exit={{ scale: 2, opacity: 0, filter: 'blur(10px)' }}
              transition={{ type: 'spring', damping: 10 }}
              className="bg-neon-magenta/90 text-white text-4xl md:text-7xl font-display font-black px-12 md:px-20 py-3 md:py-5 italic shadow-2xl border-y-4 border-white drop-shadow-glow skew-x-12 z-30 text-center"
            >
              {customBannerText}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Top HUD Panel */}
      <div className="flex flex-col w-full max-w-7xl px-2 md:px-4 z-10 pointer-events-none">
        <div className="flex justify-between w-full items-center gap-1 md:gap-4">
          
          {/* Player 1 Health */}
          <HealthBar 
            player={1} 
            health={player1Health} 
            maxHealth={p1Def.stats.health} 
            name={p1Def.name}
            color={p1Def.colors.healthBarColor}
            charId={player1CharId || 'kai-storm'}
            status={player1Status}
          />
          
          {/* Central Timer & Round Indicators */}
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 relative min-w-[80px] md:min-w-fit">
            {/* P1 Round Dots */}
            <div className="flex gap-1 md:gap-2">
              <RoundDot active={roundsWon.player1 >= 1} />
              <RoundDot active={roundsWon.player1 >= 2} />
            </div>

            <RoundTimer time={roundTimeLeft} />

            {/* P2 Round Dots */}
            <div className="flex gap-1 md:gap-2">
              <RoundDot active={roundsWon.player2 >= 1} />
              <RoundDot active={roundsWon.player2 >= 2} />
            </div>

            {/* Punishment Training Alert Overlay */}
            <AnimatePresence>
              {punishAlert && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1.1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  className={`absolute top-16 left-1/2 -translate-x-1/2 px-4 py-1 border -skew-x-12 font-display text-xs md:text-sm font-black italic tracking-widest z-15 ${
                    punishAlert === 'punished'
                      ? 'bg-neon-green/90 text-black border-white shadow-neon-green'
                      : 'bg-neon-red/90 text-white border-white shadow-neon-red animate-pulse'
                  }`}
                >
                  {punishAlert.toUpperCase()}!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Player 2 Health */}
          <HealthBar 
            player={2} 
            health={player2Health} 
            maxHealth={p2Def.stats.health} 
            name={p2Def.name}
            color={p2Def.colors.healthBarColor}
            charId={player2CharId || 'viper-x'}
            status={player2Status}
          />
          
        </div>

        {/* Meter Bars */}
        <div className="flex justify-between w-full px-2 md:px-6 mt-1">
          <MeterBar 
            player={1} 
            meter={player1Meter} 
            maxMeter={1000} 
            color={p1Def.colors.meterColor} 
            charId={player1CharId || 'kai-storm'}
          />
          <MeterBar 
            player={2} 
            meter={player2Meter} 
            maxMeter={1000} 
            color={p2Def.colors.meterColor} 
            charId={player2CharId || 'viper-x'}
          />
        </div>
      </div>

      {/* Top Pause Control Button */}
      {battleState === 'active' && (
        <button
          onClick={() => useGameStore.getState().setPaused(true)}
          className="absolute top-22 md:top-24 left-1/2 -translate-x-1/2 pointer-events-auto bg-black/45 border border-white/10 px-4 py-1.5 rounded font-display text-[10px] tracking-wider hover:border-neon-cyan transition-colors text-white/50 hover:text-white cursor-pointer z-20"
        >
          PAUSE
        </button>
      )}

      {/* Combo Counter & Frame Data Display */}
      <div className="flex justify-between w-full max-w-6xl mt-4 md:mt-8 px-4 md:px-8 z-10 pointer-events-none">
        {/* P1 Combo & Frame Data */}
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {player1Combo > 1 && (
              <motion.div
                key={player1Combo}
                initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
                animate={{ 
                  scale: [0.5, 1.45, 1.1], 
                  rotate: [-15, 12, -8],
                  opacity: 1 
                }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 450, 
                  damping: 14 
                }}
                className="flex flex-col items-start -skew-x-12 origin-left"
              >
                <span className="text-5xl md:text-7xl font-display font-black text-neon-cyan italic drop-shadow-glow">
                  {player1Combo}
                </span>
                <span className="text-[9px] md:text-xs font-mono text-neon-cyan/80 tracking-[0.3em] font-bold">HITS COMBO</span>
              </motion.div>
            )}
          </AnimatePresence>

          {p1FrameAdvantage !== null && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-start p-2 rounded bg-black/60 border border-white/10 font-mono text-xs md:text-sm -skew-x-12 pointer-events-auto"
            >
              <span className={`font-black tracking-wider ${p1FrameAdvantage >= 0 ? 'text-neon-green' : 'text-neon-red animate-pulse'}`}>
                ADV: {p1FrameAdvantage >= 0 ? `+${p1FrameAdvantage}` : p1FrameAdvantage}
              </span>
              <span className="text-[8px] text-white/50 uppercase tracking-widest mt-0.5">
                {p1FrameAdvantage >= -5 ? 'SAFE' : 'UNSAFE (PUNISHABLE)'}
              </span>
            </motion.div>
          )}
        </div>

        {/* P2 Combo & Frame Data */}
        <div className="flex flex-col gap-3 items-end">
          <AnimatePresence mode="popLayout">
            {player2Combo > 1 && (
              <motion.div
                key={player2Combo}
                initial={{ scale: 0.5, rotate: 15, opacity: 0 }}
                animate={{ 
                  scale: [0.5, 1.45, 1.1], 
                  rotate: [15, -12, 8],
                  opacity: 1 
                }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 450, 
                  damping: 14 
                }}
                className="flex flex-col items-end skew-x-12 origin-right"
              >
                <span className="text-5xl md:text-7xl font-display font-black text-neon-magenta italic drop-shadow-glow">
                  {player2Combo}
                </span>
                <span className="text-[9px] md:text-xs font-mono text-neon-magenta/80 tracking-[0.3em] font-bold">HITS COMBO</span>
              </motion.div>
            )}
          </AnimatePresence>

          {p2FrameAdvantage !== null && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-end p-2 rounded bg-black/60 border border-white/10 font-mono text-xs md:text-sm skew-x-12 pointer-events-auto"
            >
              <span className={`font-black tracking-wider ${p2FrameAdvantage >= 0 ? 'text-neon-green' : 'text-neon-red animate-pulse'}`}>
                ADV: {p2FrameAdvantage >= 0 ? `+${p2FrameAdvantage}` : p2FrameAdvantage}
              </span>
              <span className="text-[8px] text-white/50 uppercase tracking-widest mt-0.5">
                {p2FrameAdvantage >= -5 ? 'SAFE' : 'UNSAFE (PUNISHABLE)'}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile Multi-Touch Virtual Controls Overlay */}
      {isMobile && battleState === 'active' && (
        <div className="fixed inset-x-0 bottom-4 pointer-events-none z-30 select-none w-full px-4 flex justify-between items-end">
          {/* Left Side: Virtual D-Pad */}
          <div className="pointer-events-auto flex items-center justify-center w-36 h-36 md:w-44 md:h-44 bg-black/40 border border-white/10 rounded-full backdrop-blur-md relative shadow-2xl">
            {/* Center Core */}
            <div className="w-10 h-10 md:w-12 md:h-12 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full z-10" />

            {/* UP */}
            <button
              onTouchStart={(e) => { e.preventDefault(); handleTouch('up', true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleTouch('up', false); }}
              className="absolute top-0.5 w-12 h-12 md:w-14 md:h-14 bg-white/5 hover:bg-white/10 border-b border-white/5 rounded-t-full active:bg-neon-cyan/35 transition-all flex items-center justify-center cursor-pointer text-neon-cyan"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 100 100">
                <path d="M50 15L80 55H60V85H40V55H20L50 15Z" />
              </svg>
            </button>
            {/* DOWN */}
            <button
              onTouchStart={(e) => { e.preventDefault(); handleTouch('down', true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleTouch('down', false); }}
              className="absolute bottom-0.5 w-12 h-12 md:w-14 md:h-14 bg-white/5 hover:bg-white/10 border-t border-white/5 rounded-b-full active:bg-neon-cyan/35 transition-all flex items-center justify-center cursor-pointer text-neon-cyan"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 100 100">
                <path d="M50 85L20 45H40V15H60V45H80L50 85Z" />
              </svg>
            </button>
            {/* LEFT */}
            <button
              onTouchStart={(e) => { e.preventDefault(); handleTouch('left', true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleTouch('left', false); }}
              className="absolute left-0.5 w-12 h-12 md:w-14 md:h-14 bg-white/5 hover:bg-white/10 border-r border-white/5 rounded-l-full active:bg-neon-cyan/35 transition-all flex items-center justify-center cursor-pointer text-neon-cyan"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 100 100">
                <path d="M15 50L55 20V40H85V60H55V80L15 50Z" />
              </svg>
            </button>
            {/* RIGHT */}
            <button
              onTouchStart={(e) => { e.preventDefault(); handleTouch('right', true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleTouch('right', false); }}
              className="absolute right-0.5 w-12 h-12 md:w-14 md:h-14 bg-white/5 hover:bg-white/10 border-l border-white/5 rounded-r-full active:bg-neon-cyan/35 transition-all flex items-center justify-center cursor-pointer text-neon-cyan"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 100 100">
                <path d="M85 50L45 80V60H15V40H45V20L85 50Z" />
              </svg>
            </button>
          </div>

          {/* Right Side: Virtual Action Buttons Grid */}
          <div className="pointer-events-auto grid grid-cols-3 gap-2 md:gap-3 w-48 md:w-60 h-32 md:h-40 justify-items-center items-center">
            <TouchButton action="punch" color="border-neon-cyan/40 text-neon-cyan" handle={handleTouch} />
            <TouchButton action="heavyPunch" color="border-neon-magenta/40 text-neon-magenta" handle={handleTouch} />
            <TouchButton action="special" color="border-neon-green/40 text-neon-green" handle={handleTouch} />
            <TouchButton action="kick" color="border-neon-cyan/40 text-neon-cyan" handle={handleTouch} />
            <TouchButton action="heavyKick" color="border-neon-red/40 text-neon-red" handle={handleTouch} />
            <TouchButton action="super" color="border-neon-yellow/40 text-neon-yellow" handle={handleTouch} />
          </div>
        </div>
      )}

      {/* Interactive Training Sandbox Dashboard Control */}
      {gameMode === 'training' && (
        <div className="bottom-4 pointer-events-auto bg-dark-900/95 border border-neon-cyan/30 px-4 py-2.5 rounded-xl backdrop-blur-xl flex flex-wrap items-center justify-center gap-4 md:gap-6 shadow-panel z-20 mx-4 max-w-full">
          <div className="flex items-center gap-2">
            <span className="text-neon-cyan text-xs md:text-sm font-display font-black italic tracking-wider">TRAINING LAB</span>
            <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
          </div>

          <div className="hidden md:block h-6 w-px bg-white/10" />

          {/* Dummy Behavior Select */}
          <div className="flex items-center gap-2 text-[10px] md:text-xs font-mono">
            <span className="text-white/40">DUMMY:</span>
            <div className="flex flex-wrap bg-black/40 border border-white/10 p-0.5 rounded gap-0.5">
              {(['idle', 'block', 'crouch', 'crouch-block', 'cpu'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setDummyMode(mode)}
                  className={`px-2 py-0.5 rounded text-[8px] md:text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    dummyMode === mode 
                      ? 'bg-neon-cyan text-dark-900 font-extrabold' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {mode.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden md:block h-6 w-px bg-white/10" />

          {/* Toggles */}
          <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-xs font-mono">
            <button
              onClick={() => setTrainingRefill(!trainingRefill)}
              className={`px-2 md:px-3 py-0.5 rounded border transition-all cursor-pointer ${
                trainingRefill 
                  ? 'border-neon-green/40 bg-neon-green/10 text-neon-green font-bold' 
                  : 'border-white/10 bg-white/5 text-white/40'
              }`}
            >
              REFILL: {trainingRefill ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={toggleHitboxes}
              className={`px-2 md:px-3 py-0.5 rounded border transition-all cursor-pointer ${
                showHitboxes 
                  ? 'border-neon-magenta/40 bg-neon-magenta/10 text-neon-magenta font-bold' 
                  : 'border-white/10 bg-white/5 text-white/40'
              }`}
            >
              HITBOX: {showHitboxes ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Skewed Round Indicator Dot
const RoundDot: React.FC<{ active: boolean }> = ({ active }) => (
  <div className={`w-3.5 h-3.5 md:w-4.5 md:h-4.5 rounded-full border transition-all duration-300 ${
    active 
      ? 'bg-neon-cyan border-white shadow-neon-cyan scale-110' 
      : 'bg-dark-900/90 border-white/20'
  }`} />
)

// Mobile Action Buttons Component
interface TouchButtonProps {
  action: 'punch' | 'heavyPunch' | 'kick' | 'heavyKick' | 'special' | 'super'
  color: string
  handle: (act: string, pressed: boolean) => void
}

const TouchButton: React.FC<TouchButtonProps> = ({ action, color, handle }) => {
  const getIcon = () => {
    switch (action) {
      case 'punch': // LP (Light Punch)
        return (
          <div className="flex flex-col items-center gap-0.5">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M45 40H30V75H70V55H55V40ZM70 40H60V50H70V40ZM80 40H75V50H80V40ZM50 25H40V35H50V25Z" stroke="currentColor" strokeWidth="2.5" />
            </svg>
            <span className="text-[8px] font-mono leading-none font-bold">LP</span>
          </div>
        )
      case 'heavyPunch': // HP (Heavy Punch)
        return (
          <div className="flex flex-col items-center gap-0.5">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M45 40H30V75H70V55H55V40ZM70 40H60V50H70V40ZM80 40H75V50H80V40ZM50 25H40V35H50V25Z" stroke="currentColor" strokeWidth="4.5" />
            </svg>
            <span className="text-[8px] font-mono leading-none font-bold">HP</span>
          </div>
        )
      case 'kick': // LK (Light Kick)
        return (
          <div className="flex flex-col items-center gap-0.5">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 20H45V60H75V75H30V20Z" stroke="currentColor" strokeWidth="2.5" />
            </svg>
            <span className="text-[8px] font-mono leading-none font-bold">LK</span>
          </div>
        )
      case 'heavyKick': // HK (Heavy Kick)
        return (
          <div className="flex flex-col items-center gap-0.5">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 20H45V60H75V75H30V20Z" stroke="currentColor" strokeWidth="4.5" />
            </svg>
            <span className="text-[8px] font-mono leading-none font-bold">HK</span>
          </div>
        )
      case 'special': // SP (Special Fireball)
        return (
          <div className="flex flex-col items-center gap-0.5">
            <svg className="w-5 h-5 fill-current animate-pulse" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="22" stroke="currentColor" strokeWidth="3" />
              <path d="M32 32L68 68M68 32L32 68" stroke="currentColor" strokeWidth="3" />
            </svg>
            <span className="text-[8px] font-mono leading-none font-bold">SP</span>
          </div>
        )
      case 'super': // EX (EX Super Star)
        return (
          <div className="flex flex-col items-center gap-0.5">
            <svg className="w-5 h-5 fill-current animate-spin" style={{ animationDuration: '4s' }} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 15L62 42L90 45L68 63L75 90L50 75L25 90L32 63L10 45L38 42L50 15Z" stroke="currentColor" strokeWidth="2.5" />
            </svg>
            <span className="text-[8px] font-mono leading-none font-bold">EX</span>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <button
      onTouchStart={(e) => { e.preventDefault(); handle(action, true); }}
      onTouchEnd={(e) => { e.preventDefault(); handle(action, false); }}
      className={`w-12 h-12 md:w-15 md:h-15 border rounded-full backdrop-blur-md bg-black/45 font-display flex items-center justify-center shadow-lg transition-all cursor-pointer ${color}`}
    >
      {getIcon()}
    </button>
  )
}
