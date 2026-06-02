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
  const { player1CharId, player2CharId, currentStageId, matchId } = useGameStore()

  useEffect(() => {
    if (!canvasRef.current) return

    const inputManager = new InputManager(controls)
    const engine = new GameEngine3D(canvasRef.current, inputManager)
    engineRef.current = engine
    
    // Initial Setup
    const p1Def = CHARACTERS.find(c => c.id === player1CharId) || CHARACTERS[0]
    const p2Def = CHARACTERS.find(c => c.id === player2CharId) || CHARACTERS[1]
    
    engine.setupBattle(p1Def, p2Def, currentStageId)
    engine.start()

    return () => {
      engine.stop()
      inputManager.unbind()
    }
  }, [controls, player1CharId, player2CharId, currentStageId, matchId])

  return (
    <div className="relative w-full h-full bg-black">
      <canvas ref={canvasRef} className="w-full h-full outline-none" />
    </div>
  )
}
