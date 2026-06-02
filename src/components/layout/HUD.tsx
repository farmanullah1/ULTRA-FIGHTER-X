import { useGameStore } from '@stores/gameStore'
import { HealthBar } from '../ui/HealthBar'
import { RoundTimer } from '../ui/RoundTimer'
import { CHARACTERS } from '@constants/characters'
import type { CharacterDef } from '@game-types/character.types'
import { motion, AnimatePresence } from 'framer-motion'

export const HUD: React.FC = () => {
  const { 
    player1Health, player2Health, 
    player1CharId, player2CharId,
    roundTimeLeft, battleState,
    player1Combo, player2Combo,
    currentRound
  } = useGameStore()

  const p1Def = CHARACTERS.find((c: CharacterDef) => c.id === player1CharId) || CHARACTERS[0]
  const p2Def = CHARACTERS.find((c: CharacterDef) => c.id === player2CharId) || CHARACTERS[1]

  return (
    <div className="absolute inset-0 pointer-events-none p-8 flex flex-col items-center">
      {/* Banners */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <AnimatePresence>
          {battleState === 'starting' && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 2 }}
              className="flex flex-col items-center"
            >
              <motion.span className="text-4xl font-display text-neon-cyan tracking-[1em] mb-4">
                {currentRound >= 3 ? 'FINAL ROUND' : `ROUND ${currentRound}`}
              </motion.span>
              <motion.h2 className="text-9xl font-display font-black text-white italic tracking-tighter drop-shadow-glow">
                READY?
              </motion.h2>
            </motion.div>
          )}
          {battleState === 'active' && roundTimeLeft > 97 && (
            <motion.div
              initial={{ scale: 3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-9xl font-display font-black text-neon-magenta italic tracking-tighter drop-shadow-glow"
            >
              FIGHT!
            </motion.div>
          )}
          {battleState === 'ko' && (
            <motion.div
              initial={{ x: -1000, skewX: -20 }}
              animate={{ x: 0, skewX: -20 }}
              className="bg-neon-red text-white text-8xl font-display font-black px-24 py-4 italic shadow-2xl"
            >
              K. O.
            </motion.div>
          )}
          {battleState === 'round-end' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <h2 className="text-9xl font-display font-black text-white italic drop-shadow-glow">
                {player1Health > player2Health ? 'PLAYER 1' : 'PLAYER 2'}
              </h2>
              <h3 className="text-5xl font-display font-black text-neon-cyan italic">VICTORY</h3>
              
              <button 
                onClick={() => useGameStore.getState().startNewMatch()}
                className="mt-12 px-12 py-4 bg-white text-dark-900 font-display text-2xl font-black italic hover:bg-neon-cyan transition-all pointer-events-auto clip-corner-both"
              >
                REMATCH
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Top HUD */}
      <div className="flex justify-between w-full items-start z-10">
        <HealthBar 
          player={1} 
          health={player1Health} 
          maxHealth={p1Def.stats.health} 
          name={p1Def.name}
          color={p1Def.colors.healthBarColor}
        />
        
        <RoundTimer time={roundTimeLeft} />
        
        <HealthBar 
          player={2} 
          health={player2Health} 
          maxHealth={p2Def.stats.health} 
          name={p2Def.name}
          color={p2Def.colors.healthBarColor}
        />
      </div>

      {/* Combo Counters */}
      <div className="flex justify-between w-full mt-4 px-12 z-10">
        <div>
          <AnimatePresence>
            {player1Combo > 1 && (
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                className="flex flex-col items-start"
              >
                <span className="text-6xl font-display font-black text-neon-cyan italic italic-glow">
                  {player1Combo}
                </span>
                <span className="text-xl font-display text-white tracking-widest">HITS</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <AnimatePresence>
            {player2Combo > 1 && (
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                className="flex flex-col items-end"
              >
                <span className="text-6xl font-display font-black text-neon-magenta italic italic-glow">
                  {player2Combo}
                </span>
                <span className="text-xl font-display text-white tracking-widest">HITS</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Meter Bars can go here */}
    </div>
  )
}
