import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

// Exact miroir de KONAMI_CODE (utilisé par KonamiSnake)
const KONAMI_CODE_REVERSED = [
  'a', 'b', 'ArrowRight', 'ArrowLeft',
  'ArrowRight', 'ArrowLeft', 'ArrowDown',
  'ArrowDown', 'ArrowUp', 'ArrowUp',
]

const COLS = 16
const ROWS = 16
const CELL = 16
const TICK_MS = 110

const INVADER_COLS = 6
const INVADER_ROWS = 4
const INVADER_TICK_EVERY = 3
const PLAYER_ROW = ROWS - 1

type Point = { x: number; y: number }

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
}

function makeInvaders(): Point[] {
  const invaders: Point[] = []
  const startX = Math.floor((COLS - INVADER_COLS * 2) / 2)
  for (let row = 0; row < INVADER_ROWS; row++) {
    for (let col = 0; col < INVADER_COLS; col++) {
      invaders.push({ x: startX + col * 2, y: row + 1 })
    }
  }
  return invaders
}

/**
 * Easter egg PC only : code Konami inversé sur la Home ouvre un mini
 * Space Invaders jouable aux flèches + espace. Désactivé sur mobile/tablette.
 */
export default function KonamiInvaders() {
  const [isOpen, setIsOpen] = useState(false)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bufferRef = useRef<string[]>([])
  const gameRef = useRef<{
    playerX: number
    bullet: Point | null
    invaders: Point[]
    dir: 1 | -1
    tick: number
  } | null>(null)

  const draw = () => {
    const canvas = canvasRef.current
    const game = gameRef.current
    if (!canvas || !game) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#4ade80'
    game.invaders.forEach((inv) => {
      ctx.fillRect(inv.x * CELL + 2, inv.y * CELL + 2, CELL - 4, CELL - 4)
    })

    ctx.fillStyle = '#facc15'
    ctx.fillRect(game.playerX * CELL + 3, PLAYER_ROW * CELL + 3, CELL - 6, CELL - 6)

    if (game.bullet) {
      ctx.fillStyle = '#f87171'
      ctx.fillRect(game.bullet.x * CELL + CELL / 2 - 1, game.bullet.y * CELL, 2, CELL)
    }
  }

  const resetGame = useCallback(() => {
    gameRef.current = {
      playerX: Math.floor(COLS / 2),
      bullet: null,
      invaders: makeInvaders(),
      dir: 1,
      tick: 0,
    }
    setScore(0)
    setGameOver(false)
    setWon(false)
  }, [])

  const openGame = useCallback(() => {
    resetGame()
    setIsOpen(true)
  }, [resetGame])

  // Écoute globale du code Konami inversé (desktop uniquement).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isOpen) return
      if (window.innerWidth < 1024) return
      if (isTypingTarget(e.target)) return

      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      const buffer = [...bufferRef.current, key].slice(-KONAMI_CODE_REVERSED.length)
      bufferRef.current = buffer

      if (
        buffer.length === KONAMI_CODE_REVERSED.length &&
        buffer.every((k, i) => k === KONAMI_CODE_REVERSED[i])
      ) {
        bufferRef.current = []
        openGame()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, openGame])

  // Contrôles + boucle de jeu tant que la modale est ouverte.
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      const game = gameRef.current
      if (!game) return

      if (e.key === 'Escape') {
        setIsOpen(false)
        return
      }

      if (!['ArrowLeft', 'ArrowRight', ' ', 'Spacebar'].includes(e.key)) return
      e.preventDefault()
      if (gameOver) return

      if (e.key === 'ArrowLeft') {
        game.playerX = Math.max(0, game.playerX - 1)
        draw()
      } else if (e.key === 'ArrowRight') {
        game.playerX = Math.min(COLS - 1, game.playerX + 1)
        draw()
      } else if (!game.bullet) {
        game.bullet = { x: game.playerX, y: PLAYER_ROW - 1 }
        draw()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    if (gameOver) {
      draw()
      return () => window.removeEventListener('keydown', onKeyDown)
    }

    const interval = setInterval(() => {
      const game = gameRef.current
      if (!game) return

      game.tick++

      // Balle du joueur
      if (game.bullet) {
        game.bullet.y -= 1
        if (game.bullet.y < 0) {
          game.bullet = null
        } else {
          const hitIndex = game.invaders.findIndex(
            (inv) => inv.x === game.bullet!.x && inv.y === game.bullet!.y,
          )
          if (hitIndex !== -1) {
            game.invaders.splice(hitIndex, 1)
            game.bullet = null
            setScore((s) => s + 10)
          }
        }
      }

      // Déplacement des envahisseurs
      if (game.tick % INVADER_TICK_EVERY === 0 && game.invaders.length > 0) {
        const maxX = Math.max(...game.invaders.map((i) => i.x))
        const minX = Math.min(...game.invaders.map((i) => i.x))
        const hitsWall =
          (game.dir === 1 && maxX >= COLS - 1) || (game.dir === -1 && minX <= 0)

        if (hitsWall) {
          game.dir = (game.dir * -1) as 1 | -1
          game.invaders.forEach((inv) => (inv.y += 1))
        } else {
          game.invaders.forEach((inv) => (inv.x += game.dir))
        }
      }

      // Conditions de fin
      if (game.invaders.length === 0) {
        setWon(true)
        setGameOver(true)
        return
      }
      if (game.invaders.some((inv) => inv.y >= PLAYER_ROW)) {
        setGameOver(true)
        return
      }

      draw()
    }, TICK_MS)

    draw()

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      clearInterval(interval)
    }
  }, [isOpen, gameOver])

  if (!isOpen) return null

  return (
    <div className="snake-overlay" onClick={() => setIsOpen(false)}>
      <div className="snake-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="snake-modal-header">
          <h2 className="snake-modal-title">👾 Code Konami inversé !</h2>
          <button onClick={() => setIsOpen(false)} className="snake-modal-close" aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        <p className="snake-score">Score : {score}</p>

        <div className="snake-board-wrap">
          <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} className="snake-board" />
          {gameOver && (
            <div className="snake-gameover">
              <p className="snake-gameover-title">{won ? 'Gagné !' : 'Perdu !'}</p>
              <p className="snake-gameover-score">Score final : {score}</p>
              <button onClick={resetGame} className="snake-replay-btn">Rejouer</button>
            </div>
          )}
        </div>

        <p className="snake-hint">← → pour bouger · Espace pour tirer · Échap pour fermer</p>
      </div>
    </div>
  )
}