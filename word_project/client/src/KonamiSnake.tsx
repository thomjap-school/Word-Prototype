import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
]

const COLS = 16
const ROWS = 16
const CELL = 16
const TICK_MS = 110

type Point = { x: number; y: number }

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
}

function randomFood(snake: Point[]): Point {
  let food: Point
  do {
    food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
  } while (snake.some((s) => s.x === food.x && s.y === food.y))
  return food
}

/**
 * Easter egg PC only : code Konami sur la Home ouvre un mini Snake jouable
 * aux flèches directionnelles. Désactivé sur mobile/tablette (pas de clavier).
 */
export default function KonamiSnake() {
  const [isOpen, setIsOpen] = useState(false)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bufferRef = useRef<string[]>([])
  const gameRef = useRef<{
    snake: Point[]
    dir: Point
    nextDir: Point
    food: Point
  } | null>(null)

  const draw = () => {
    const canvas = canvasRef.current
    const game = gameRef.current
    if (!canvas || !game) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#f9fafb'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(
      game.food.x * CELL + CELL / 2,
      game.food.y * CELL + CELL / 2,
      CELL / 2.6,
      0,
      Math.PI * 2,
    )
    ctx.fill()

    game.snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? '#1d4ed8' : '#2563eb'
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2)
    })
  }

  const resetGame = useCallback(() => {
    const snake: Point[] = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }]
    gameRef.current = {
      snake,
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: randomFood(snake),
    }
    setScore(0)
    setGameOver(false)
  }, [])

  const openGame = useCallback(() => {
    resetGame()
    setIsOpen(true)
  }, [resetGame])

  // Écoute globale du code Konami (desktop uniquement).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isOpen) return
      if (window.innerWidth < 1024) return
      if (isTypingTarget(e.target)) return

      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      const buffer = [...bufferRef.current, key].slice(-KONAMI_CODE.length)
      bufferRef.current = buffer

      if (buffer.length === KONAMI_CODE.length && buffer.every((k, i) => k === KONAMI_CODE[i])) {
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

      const moves: Record<string, Point> = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
      }
      const move = moves[e.key]
      if (!move) return

      e.preventDefault()
      if (gameOver) return
      if (move.x === -game.dir.x && move.y === -game.dir.y) return
      game.nextDir = move
    }

    window.addEventListener('keydown', onKeyDown)

    if (gameOver) {
      draw()
      return () => window.removeEventListener('keydown', onKeyDown)
    }

    const interval = setInterval(() => {
      const game = gameRef.current
      if (!game) return

      game.dir = game.nextDir
      const head = { x: game.snake[0].x + game.dir.x, y: game.snake[0].y + game.dir.y }

      const hitWall = head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS
      // Le dernier segment (la queue) va se libérer ce tick sauf si on mange —
      // et si on mange, la nourriture n'est jamais placée sur le serpent, donc
      // l'exclure ici n'affecte que le cas sûr d'un mouvement dans son propre sillage.
      const hitSelf = game.snake.slice(0, -1).some((s) => s.x === head.x && s.y === head.y)

      if (hitWall || hitSelf) {
        setGameOver(true)
        return
      }

      game.snake.unshift(head)
      if (head.x === game.food.x && head.y === game.food.y) {
        setScore((s) => s + 1)
        game.food = randomFood(game.snake)
      } else {
        game.snake.pop()
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
          <h2 className="snake-modal-title">🐍 Code Konami !</h2>
          <button onClick={() => setIsOpen(false)} className="snake-modal-close" aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        <p className="snake-score">Score : {score}</p>

        <div className="snake-board-wrap">
          <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} className="snake-board" />
          {gameOver && (
            <div className="snake-gameover">
              <p className="snake-gameover-title">Perdu !</p>
              <p className="snake-gameover-score">Score final : {score}</p>
              <button onClick={resetGame} className="snake-replay-btn">Rejouer</button>
            </div>
          )}
        </div>

        <p className="snake-hint">Flèches directionnelles pour bouger · Échap pour fermer</p>
      </div>
    </div>
  )
}
