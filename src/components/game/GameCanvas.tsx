import React, { useEffect, useRef } from 'react'
import { GameEngine3D } from '@engine/core/GameEngine3D'
import { InputManager } from '@engine/core/InputManager'
import { useSettingsStore } from '@stores/settingsStore'
import { useGameStore } from '@stores/gameStore'
import { CHARACTERS } from '@constants/characters'

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine3D | null>(null)
  const { controls } = useSettingsStore()
  const { 
    screen, player1CharId, player2CharId, 
    player1HoveredCharId, player2HoveredCharId, 
    player1ColorIndex, player2ColorIndex,
    currentStageId, matchId 
  } = useGameStore()

  useEffect(() => {
    (window as any).confirmCSSSelection = (player: 1 | 2) => {
      if (engineRef.current) {
        engineRef.current.confirmCSSSelection(player)
      }
    }
    return () => {
      delete (window as any).confirmCSSSelection
    }
  }, [])

  useEffect(() => {
    if (screen === 'character-select' && engineRef.current) {
      engineRef.current.changeCSSCharacter(1, player1HoveredCharId)
    }
  }, [player1HoveredCharId, player1ColorIndex, screen])

  useEffect(() => {
    if (screen === 'character-select' && engineRef.current) {
      engineRef.current.changeCSSCharacter(2, player2HoveredCharId)
    }
  }, [player2HoveredCharId, player2ColorIndex, screen])

  useEffect(() => {
    if (!canvasRef.current) return

    const inputManager = new InputManager(controls)
    const engine = new GameEngine3D(canvasRef.current, inputManager)
    engineRef.current = engine
    
    // Attract mode if characters are not chosen yet
    const isAttract = (!player1CharId || !player2CharId) && screen !== 'character-select'
    let p1Def = CHARACTERS.find(c => c.id === player1CharId)
    let p2Def = CHARACTERS.find(c => c.id === player2CharId)
    let stage = currentStageId

    if (isAttract) {
      // Pick random characters for P1 and P2
      const p1Random = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
      const otherChars = CHARACTERS.filter(c => c.id !== p1Random.id)
      const p2Random = otherChars[Math.floor(Math.random() * otherChars.length)]
      
      p1Def = p1Random
      p2Def = p2Random
      
      const stages = ['cyber-city', 'volcano', 'space-station', 'neon-dojo']
      stage = stages[Math.floor(Math.random() * stages.length)]
      
      // Update store state for attract mode
      useGameStore.getState().setGameMode('attract')
    }

    if (screen === 'character-select') {
      engine.setupCharacterSelect(player1HoveredCharId, player2HoveredCharId)
    } else {
      engine.setupBattle(p1Def || CHARACTERS[0], p2Def || CHARACTERS[1], stage)
    }
    
    engine.start()

    return () => {
      engine.stop()
      inputManager.unbind()
    }
  }, [controls, player1CharId, player2CharId, currentStageId, matchId, screen])

  return (
    <div className="relative w-full h-full bg-black">
      <canvas ref={canvasRef} className="w-full h-full outline-none" />
    </div>
  )
}
