import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@stores/gameStore'
import { CHARACTERS } from '@constants/characters'
import type { CharacterDef } from '@game-types/character.types'

interface VFXEvent {
  id: number
  type: 'hit-flash' | 'heavy-flash' | 'counter-hit' | 'punish' | 'perfect' | 'combo-bump' | 'slow-mo' | 'parry' | 'ultra-combo'
  x?: number
  y?: number
  color?: string
}

let vfxIdCounter = 0

// Global VFX bus — engine calls this
export const vfxBus = {
  listeners: new Set<(event: VFXEvent) => void>(),
  emit(event: Omit<VFXEvent, 'id'>) {
    const e = { ...event, id: vfxIdCounter++ }
    this.listeners.forEach(fn => fn(e))
  }
}

export const VFXOverlay: React.FC = () => {
  const { player1Health, player2Health, player1Combo, player2Combo, battleState, player1CharId, player2CharId } = useGameStore()
  const [events, setEvents] = useState<VFXEvent[]>([])
  const [flashOpacity, setFlashOpacity] = useState(0)
  const [flashColor, setFlashColor] = useState('255,255,255')
  const [chromaAberration, setChromaAberration] = useState(0)
  const [slowMoActive, setSlowMoActive] = useState(false)
  const [p1ComboDisplay, setP1ComboDisplay] = useState(0)
  const [p2ComboDisplay, setP2ComboDisplay] = useState(0)
  const p1ComboRef = useRef(0)
  const p2ComboRef = useRef(0)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const chromaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const p1Def = CHARACTERS.find((c: CharacterDef) => c.id === player1CharId) || CHARACTERS[0]
  const p2Def = CHARACTERS.find((c: CharacterDef) => c.id === player2CharId) || CHARACTERS[1]

  const addEvent = useCallback((event: VFXEvent) => {
    setEvents(prev => [...prev.slice(-8), event])
    setTimeout(() => {
      setEvents(prev => prev.filter(e => e.id !== event.id))
    }, 2200)
  }, [])

  // Flash helper
  const triggerFlash = useCallback((color: string, intensity: number, duration: number) => {
    setFlashColor(color)
    setFlashOpacity(intensity)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setFlashOpacity(0), duration)
  }, [])

  // Chroma aberration helper
  const triggerChroma = useCallback((intensity: number, duration: number) => {
    setChromaAberration(intensity)
    if (chromaTimerRef.current) clearTimeout(chromaTimerRef.current)
    chromaTimerRef.current = setTimeout(() => setChromaAberration(0), duration)
  }, [])

  // Listen to VFX bus
  useEffect(() => {
    const handler = (event: VFXEvent) => {
      switch (event.type) {
        case 'hit-flash':
          triggerFlash('255,255,255', 0.3, 80)
          break
        case 'heavy-flash':
          triggerFlash('255,255,255', 0.55, 120)
          triggerChroma(4, 250)
          break
        case 'slow-mo':
          setSlowMoActive(true)
          setTimeout(() => setSlowMoActive(false), 3000)
          break
        case 'parry':
          triggerFlash('0,255,255', 0.5, 100)
          addEvent(event)
          break
        case 'ultra-combo':
          triggerFlash('255,0,255', 0.6, 200)
          triggerChroma(6, 400)
          addEvent(event)
          break
        default:
          addEvent(event)
      }
    }
    vfxBus.listeners.add(handler)
    return () => { vfxBus.listeners.delete(handler) }
  }, [triggerFlash, triggerChroma, addEvent])

  // Combo counter tracking
  useEffect(() => {
    if (player1Combo > p1ComboRef.current && player1Combo > 2) {
      setP1ComboDisplay(player1Combo)
      vfxBus.emit({ type: 'combo-bump' })
      if (player1Combo >= 10) vfxBus.emit({ type: 'ultra-combo' })
    }
    if (player1Combo === 0 && p1ComboRef.current > 0) {
      setTimeout(() => setP1ComboDisplay(0), 800)
    }
    p1ComboRef.current = player1Combo
  }, [player1Combo])

  useEffect(() => {
    if (player2Combo > p2ComboRef.current && player2Combo > 2) {
      setP2ComboDisplay(player2Combo)
      if (player2Combo >= 10) vfxBus.emit({ type: 'ultra-combo' })
    }
    if (player2Combo === 0 && p2ComboRef.current > 0) {
      setTimeout(() => setP2ComboDisplay(0), 800)
    }
    p2ComboRef.current = player2Combo
  }, [player2Combo])

  // Health-based low health vignette
  const p1LowHealth = player1Health / 1000 < 0.25
  const p2LowHealth = player2Health / 1000 < 0.25
  const anyLowHealth = p1LowHealth || p2LowHealth

  if (battleState !== 'active' && battleState !== 'ko' && battleState !== 'starting') return null

  return (
    <div
      className="absolute inset-0 pointer-events-none z-30 overflow-hidden"
      style={chromaAberration > 0 ? { filter: `url(#chroma-aberration)` } : {}}
    >
      {/* SVG filter for chromatic aberration */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="chroma-aberration" x="-5%" y="-5%" width="110%" height="110%">
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" in="SourceGraphic" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" in="SourceGraphic" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" in="SourceGraphic" />
            <feOffset dx={`-${chromaAberration}`} dy="0" result="redOffset" in="red" />
            <feOffset dx={`${chromaAberration}`} dy="0" result="blueOffset" in="blue" />
            <feMerge>
              <feMergeNode in="redOffset" />
              <feMergeNode in="green" />
              <feMergeNode in="blueOffset" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Hit flash overlay */}
      <AnimatePresence>
        {flashOpacity > 0 && (
          <motion.div
            key="flash"
            initial={{ opacity: flashOpacity }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(${flashColor},${flashOpacity})`, mixBlendMode: 'screen' }}
          />
        )}
      </AnimatePresence>

      {/* Low health red vignette */}
      <AnimatePresence>
        {anyLowHealth && battleState === 'active' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(255,0,0,0.3) 100%)'
            }}
          />
        )}
      </AnimatePresence>

      {/* Slow-motion tint */}
      <AnimatePresence>
        {slowMoActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse, transparent 30%, rgba(0,0,60,0.35) 100%)',
              mixBlendMode: 'multiply'
            }}
          />
        )}
      </AnimatePresence>

      {/* P1 Combo Counter (bottom-left) */}
      <AnimatePresence>
        {p1ComboDisplay > 2 && (
          <motion.div
            key={`p1-combo-${p1ComboDisplay}`}
            initial={{ scale: 1.8, opacity: 0, x: -20 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="absolute bottom-28 left-6 md:left-10 flex flex-col items-start"
          >
            <div
              className="font-display font-black italic leading-none"
              style={{
                fontSize: `clamp(3rem, 8vw, 7rem)`,
                color: p1Def.colors.primary,
                textShadow: `0 0 20px ${p1Def.colors.primary}, 0 0 40px ${p1Def.colors.primary}88`,
                WebkitTextStroke: '1px rgba(255,255,255,0.3)'
              }}
            >
              {p1ComboDisplay}
            </div>
            <div className="text-white/70 font-mono text-xs md:text-sm tracking-[0.3em] font-black uppercase -mt-1">
              {p1ComboDisplay >= 10 ? '⚡ ULTRA COMBO!' : p1ComboDisplay >= 5 ? '🔥 COMBO' : 'HIT COMBO'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* P2 Combo Counter (bottom-right) */}
      <AnimatePresence>
        {p2ComboDisplay > 2 && (
          <motion.div
            key={`p2-combo-${p2ComboDisplay}`}
            initial={{ scale: 1.8, opacity: 0, x: 20 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="absolute bottom-28 right-6 md:right-10 flex flex-col items-end"
          >
            <div
              className="font-display font-black italic leading-none"
              style={{
                fontSize: `clamp(3rem, 8vw, 7rem)`,
                color: p2Def.colors.primary,
                textShadow: `0 0 20px ${p2Def.colors.primary}, 0 0 40px ${p2Def.colors.primary}88`,
                WebkitTextStroke: '1px rgba(255,255,255,0.3)'
              }}
            >
              {p2ComboDisplay}
            </div>
            <div className="text-white/70 font-mono text-xs md:text-sm tracking-[0.3em] font-black uppercase -mt-1">
              {p2ComboDisplay >= 10 ? '⚡ ULTRA COMBO!' : p2ComboDisplay >= 5 ? '🔥 COMBO' : 'HIT COMBO'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combat text popups */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {events.filter(e => ['counter-hit','punish','perfect','parry','ultra-combo'].includes(e.type)).map(event => (
            <motion.div
              key={event.id}
              initial={{ scale: 0.3, opacity: 0, y: 40, rotateX: 90 }}
              animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
              exit={{ scale: 1.4, opacity: 0, y: -30, filter: 'blur(8px)' }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="absolute font-display font-black italic tracking-tighter text-center"
              style={{
                fontSize: event.type === 'ultra-combo' ? 'clamp(2rem, 5vw, 4rem)' : 'clamp(1.5rem, 4vw, 3rem)',
                color: event.type === 'counter-hit' ? '#FFE600'
                     : event.type === 'punish' ? '#FF6600'
                     : event.type === 'perfect' ? '#00FF88'
                     : event.type === 'parry' ? '#00FFFF'
                     : '#FF00FF',
                textShadow: `0 0 20px currentColor, 0 0 40px currentColor`,
                top: event.type === 'ultra-combo' ? '38%' : '45%',
                left: '50%',
                transform: 'translateX(-50%)',
                WebkitTextStroke: '1px rgba(255,255,255,0.5)',
                zIndex: 50
              }}
            >
              {event.type === 'counter-hit' ? '⚡ COUNTER HIT!' 
               : event.type === 'punish' ? '💥 PUNISH!'
               : event.type === 'perfect' ? '✨ PERFECT!'
               : event.type === 'parry' ? '🛡 PARRY!'
               : '🔥 ULTRA COMBO!!'}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
