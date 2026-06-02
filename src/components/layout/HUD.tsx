import { useGameStore } from '@stores/gameStore'
import { HealthBar } from '../ui/HealthBar'
import { RoundTimer } from '../ui/RoundTimer'
import { CHARACTERS } from '@constants/characters'
import type { CharacterDef } from '@game-types/character.types'

export const HUD: React.FC = () => {
  const { 
    player1Health, player2Health, 
    player1CharId, player2CharId,
    roundTimeLeft 
  } = useGameStore()

  const p1Def = CHARACTERS.find((c: CharacterDef) => c.id === player1CharId) || CHARACTERS[0]
  const p2Def = CHARACTERS.find((c: CharacterDef) => c.id === player2CharId) || CHARACTERS[1]

  return (
    <div className="absolute inset-0 pointer-events-none p-8 flex flex-col items-center">
      {/* Top HUD */}
      <div className="flex justify-between w-full items-start">
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

      {/* Meter Bars can go here */}
    </div>
  )
}
