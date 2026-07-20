import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const KONAMI_CODE = [
  "a", "b", "ArrowRight", "ArrowLeft",
  "ArrowRight", "ArrowLeft", "ArrowDown",
  "ArrowUp", "ArrowDown", "ArrowUp",
].map((k) => k.toLowerCase());

const COLS = 16;
const ROWS = 16;
const CELL = 16;
const TICK_MS = 110;

const INVADER_COLS = 8;
const INVADER_ROWS = 4;
const INVADER_TICK_EVERY = 3; // les envahisseurs bougent moins vite que la boucle de jeu
const PLAYER_ROW = ROWS - 1;

type Vec = { x: number; y: number };

interface GameState {
  playerX: number;
  bullet: Vec | null;
  invaders: Vec[];
  dir: 1 | -1;
  tick: number;
  gameOver: boolean;
  won: boolean;
  score: number;
}

function makeInvaders(): Vec[] {
  const invaders: Vec[] = [];
  const startX = Math.floor((COLS - INVADER_COLS * 2) / 2);
  for (let row = 0; row < INVADER_ROWS; row++) {
    for (let col = 0; col < INVADER_COLS; col++) {
      invaders.push({ x: startX + col * 2, y: row + 1 });
    }
  }
  return invaders;
}

function makeInitialState(): GameState {
  return {
    playerX: Math.floor(COLS / 2),
    bullet: null,
    invaders: makeInvaders(),
    dir: 1,
    tick: 0,
    gameOver: false,
    won: false,
    score: 0,
  };
}

export default function KonamiSpaceInvaders() {
  const [active, setActive] = useState(false);
  const bufferRef = useRef<string[]>([]);
  const stateRef = useRef<GameState>(makeInitialState());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, forceRender] = useState(0);

  // --- Détection du code (inversé) ---
  useEffect(() => {
    if (active) return; // pas besoin d'écouter pendant que le jeu tourne

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const buffer = [...bufferRef.current, key].slice(-KONAMI_CODE.length);
      bufferRef.current = buffer;

      if (
        buffer.length === KONAMI_CODE.length &&
        buffer.every((k, i) => k === KONAMI_CODE[i])
      ) {
        bufferRef.current = [];
        stateRef.current = makeInitialState();
        setActive(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  // --- Fermeture ---
  const close = useCallback(() => {
    setActive(false);
    bufferRef.current = [];
  }, []);

  // --- Contrôles du jeu ---
  useEffect(() => {
    if (!active) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;

      if (e.key === "Escape") {
        close();
        return;
      }

      if (["ArrowLeft", "ArrowRight", " ", "Spacebar"].includes(e.key)) {
        e.preventDefault();
      }

      if (s.gameOver) return;

      if (e.key === "ArrowLeft") {
        s.playerX = Math.max(0, s.playerX - 1);
      } else if (e.key === "ArrowRight") {
        s.playerX = Math.min(COLS - 1, s.playerX + 1);
      } else if (e.key === " " || e.key === "Spacebar") {
        if (!s.bullet) {
          s.bullet = { x: s.playerX, y: PLAYER_ROW - 1 };
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, close]);

  // --- Boucle de jeu ---
  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      const s = stateRef.current;
      if (s.gameOver) return;

      s.tick++;

      // Balle du joueur
      if (s.bullet) {
        s.bullet.y -= 1;
        if (s.bullet.y < 0) {
          s.bullet = null;
        } else {
          const hitIndex = s.invaders.findIndex(
            (inv) => inv.x === s.bullet!.x && inv.y === s.bullet!.y
          );
          if (hitIndex !== -1) {
            s.invaders.splice(hitIndex, 1);
            s.bullet = null;
            s.score += 10;
          }
        }
      }

      // Déplacement des envahisseurs (plus lent que la boucle principale)
      if (s.tick % INVADER_TICK_EVERY === 0 && s.invaders.length > 0) {
        const maxX = Math.max(...s.invaders.map((i) => i.x));
        const minX = Math.min(...s.invaders.map((i) => i.x));
        const hitsWall =
          (s.dir === 1 && maxX >= COLS - 1) ||
          (s.dir === -1 && minX <= 0);

        if (hitsWall) {
          s.dir = (s.dir * -1) as 1 | -1;
          s.invaders.forEach((inv) => (inv.y += 1));
        } else {
          s.invaders.forEach((inv) => (inv.x += s.dir));
        }
      }

      // Conditions de fin
      if (s.invaders.length === 0) {
        s.won = true;
        s.gameOver = true;
      }
      if (s.invaders.some((inv) => inv.y >= PLAYER_ROW)) {
        s.gameOver = true;
      }

      forceRender((n) => n + 1);
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [active]);

  // --- Rendu canvas ---
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const s = stateRef.current;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

    ctx.fillStyle = "#4ade80";
    s.invaders.forEach((inv) => {
      ctx.fillRect(inv.x * CELL + 2, inv.y * CELL + 2, CELL - 4, CELL - 4);
    });

    ctx.fillStyle = "#facc15";
    ctx.fillRect(s.playerX * CELL + 3, PLAYER_ROW * CELL + 3, CELL - 6, CELL - 6);

    if (s.bullet) {
      ctx.fillStyle = "#f87171";
      ctx.fillRect(s.bullet.x * CELL + CELL / 2 - 1, s.bullet.y * CELL, 2, CELL);
    }
  });

  if (!active) return null;

  const s = stateRef.current;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
      <button
        onClick={close}
        className="absolute top-4 right-4 text-green-400 hover:text-green-200"
        aria-label="Fermer"
      >
        <X size={28} />
      </button>

      <div className="mb-2 font-mono text-green-400 text-sm tracking-widest">
        SCORE: {s.score}
      </div>

      <canvas
        ref={canvasRef}
        width={COLS * CELL}
        height={ROWS * CELL}
        style={{
          width: COLS * CELL * 2,
          height: ROWS * CELL * 2,
          imageRendering: "pixelated",
          border: "2px solid #4ade80",
        }}
      />

      {s.gameOver && (
        <div className="mt-4 font-mono text-green-400 text-lg">
          {s.won ? "GAGNÉ 👾" : "GAME OVER"} — Échap ou clique sur la croix pour fermer
        </div>
      )}

      <div className="mt-3 font-mono text-green-600 text-xs">
        ← → pour bouger, Espace pour tirer
      </div>
    </div>
  );
}