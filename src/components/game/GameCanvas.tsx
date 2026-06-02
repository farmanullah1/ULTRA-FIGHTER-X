import React, { useEffect, useRef } from 'react'
import { GameEngine3D } from '@engine/core/GameEngine3D'
import { InputManager } from '@engine/core/InputManager'
import { useSettingsStore } from '@stores/settingsStore'

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine3D | null>(null)
  const { controls } = useSettingsStore()

  useEffect(() => {
    if (!canvasRef.current) return

    const inputManager = new InputManager(controls)
    const engine = new GameEngine3D(canvasRef.current, inputManager)
    engineRef.current = engine
    
    engine.start()

    return () => {
      engine.stop()
      inputManager.unbind()
    }
  }, [controls])

  return (
    <div className="relative w-full h-full bg-black">
      <canvas ref={canvasRef} className="w-full h-full outline-none" />
    </div>
  )
}
