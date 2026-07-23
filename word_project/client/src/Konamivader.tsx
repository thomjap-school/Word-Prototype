import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const KONAMI_CODE = [
  'a', 'b', 'ArrowRight', 'ArrowLeft',
  'ArrowRight', 'ArrowLeft', 'ArrowDown',
  'ArrowDown', 'ArrowUp', 'ArrowUp',
].map((k) => k.toLowerCase());

const COLS = 16;
const ROWS = 16;
const CELL = 16;
const TICK_MS = 110;

const INVADER_COLS = 6;
const INVADER_ROWS = 3;
const TOTAL_INVADERS = INVADER_COLS * INVADER_ROWS;
const INVADER_TICK_EVERY = 3; // les envahisseurs bougent moins vite que la boucle de jeu (au départ)
const MIN_INVADER_TICK_EVERY = 1.7; // vitesse plafond en fin de vague, pour une accélération progressive
const PLAYER_ROW = ROWS - 1;

const FIRE_COOLDOWN_MS = 300; // temps de rechargement entre deux tirs
const FIRE_COOLDOWN_TICKS = Math.max(1, Math.round(FIRE_COOLDOWN_MS / TICK_MS));

const INITIAL_LIVES = 3;
const HIGH_SCORE_KEY = 'konamivader_high_score';

const INVADER_ROW_COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80'];

// Petit sprite façon "crabe" à 2 frames pour animer la marche des envahisseurs
const INVADER_FRAMES = [
  [
    '00111100',
    '01111110',
    '11011011',
    '11111111',
    '00100100',
    '01000010',
  ],
  [
    '00111100',
    '01111110',
    '11011011',
    '11111111',
    '01000010',
    '10000001',
  ],
];

type Vec = { x: number; y: number };
type Invader = Vec & { row: number };
type Particle = Vec & { ttl: number };
type Star = { x: number; y: number; size: number; phase: number };

interface GameState {
  playerX: number;
  bullets: Vec[];
  invaders: Invader[];
  particles: Particle[];
  dir: 1 | -1;
  tick: number;
  invaderMoveAcc: number; // accumulateur pour une vitesse d'invasion continue (pas de palier brusque)
  invaderFrame: 0 | 1;
  cooldownUntilTick: number; // tick à partir duquel on peut retirer
  lives: number;
  paused: boolean;
  gameOver: boolean;
  won: boolean;
  score: number;
}

// Tire `count` positions distinctes dans [min, max] (mélange de Fisher-Yates)
function pickDistinct(count: number, min: number, max: number): number[] {
  const pool: number[] = [];
  for (let i = min; i <= max; i++) pool.push(i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).sort((a, b) => a - b);
}

function makeInvaders(): Invader[] {
  const invaders: Invader[] = [];
  const margin = 1;
  for (let row = 0; row < INVADER_ROWS; row++) {
    const xs = pickDistinct(INVADER_COLS, margin, COLS - 1 - margin);
    xs.forEach((x) => invaders.push({ x, y: row + 1, row }));
  }
  return invaders;
}

function makeInitialState(): GameState {
  return {
    playerX: Math.floor(COLS / 2),
    bullets: [],
    invaders: makeInvaders(),
    particles: [],
    dir: 1,
    tick: 0,
    invaderMoveAcc: 0,
    invaderFrame: 0,
    cooldownUntilTick: 0,
    lives: INITIAL_LIVES,
    paused: false,
    gameOver: false,
    won: false,
    score: 0,
  };
}

function generateStars(count: number, width: number, height: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() < 0.75 ? 1 : 2,
      phase: Math.random() * 50,
    });
  }
  return stars;
}

// --- Petits bips synthétisés (pas de fichier audio à charger) ---
let sharedAudioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!sharedAudioCtx) sharedAudioCtx = new AudioCtor();
  return sharedAudioCtx;
}

function beep(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.05) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.stop(ctx.currentTime + duration);
}

const playShootSound = () => beep(880, 0.06, 'square', 0.04);
const playExplosionSound = () => beep(120, 0.15, 'sawtooth', 0.06);
const playGameOverSound = () => beep(80, 0.6, 'sawtooth', 0.08);
const playWinSound = () => {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.15, 'square', 0.05), i * 120));
};

export default function KonamiSpaceInvaders() {
  const [active, setActive] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const bufferRef = useRef<string[]>([]);
  const stateRef = useRef<GameState>(makeInitialState());
  const keysRef = useRef({ left: false, right: false, space: false });
  const highScoreRef = useRef(0);
  const starsRef = useRef<Star[]>(generateStars(40, COLS * CELL, ROWS * CELL));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const stored = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
    highScoreRef.current = stored;
    setHighScore(stored);
  }, []);

  const finalizeScore = useCallback((score: number) => {
    if (score > highScoreRef.current) {
      highScoreRef.current = score;
      setHighScore(score);
      localStorage.setItem(HIGH_SCORE_KEY, String(score));
    }
  }, []);

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
        starsRef.current = generateStars(40, COLS * CELL, ROWS * CELL);
        setActive(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active]);

  // --- Fermeture ---
  const close = useCallback(() => {
    setActive(false);
    bufferRef.current = [];
  }, []);

  // --- Redémarrage (sans fermer l'overlay) ---
  const restart = useCallback(() => {
    stateRef.current = makeInitialState();
    forceRender((n) => n + 1);
  }, []);

  // --- Contrôles du jeu (déplacement continu + tir maintenu, pause) ---
  useEffect(() => {
    if (!active) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;

      if (e.key === 'Escape') {
        close();
        return;
      }

      if (['ArrowLeft', 'ArrowRight', ' ', 'Spacebar'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft') keysRef.current.left = true;
      else if (e.key === 'ArrowRight') keysRef.current.right = true;
      else if (e.key === ' ' || e.key === 'Spacebar') keysRef.current.space = true;
      else if (e.key === 'p' || e.key === 'P') {
        if (!s.gameOver) {
          s.paused = !s.paused;
          forceRender((n) => n + 1);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (s.gameOver) restart();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keysRef.current.left = false;
      else if (e.key === 'ArrowRight') keysRef.current.right = false;
      else if (e.key === ' ' || e.key === 'Spacebar') keysRef.current.space = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      keysRef.current = { left: false, right: false, space: false };
    };
  }, [active, close, restart]);

  // --- Boucle de jeu ---
  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      const s = stateRef.current;
      if (s.gameOver || s.paused) return;

      s.tick++;

      const keys = keysRef.current;
      if (keys.left && !keys.right) {
        s.playerX = Math.max(0, s.playerX - 1);
      } else if (keys.right && !keys.left) {
        s.playerX = Math.min(COLS - 1, s.playerX + 1);
      }
      if (keys.space && s.tick >= s.cooldownUntilTick) {
        s.bullets.push({ x: s.playerX, y: PLAYER_ROW - 1 });
        s.cooldownUntilTick = s.tick + FIRE_COOLDOWN_TICKS;
        playShootSound();
      }

      // Déplacement des balles (plusieurs peuvent coexister, indépendantes les unes des autres)
      const remainingBullets: Vec[] = [];
      for (const bullet of s.bullets) {
        bullet.y -= 1;
        if (bullet.y < 0) continue; // sortie de l'écran

        const hitIndex = s.invaders.findIndex(
          (inv) => inv.x === bullet.x && inv.y === bullet.y
        );
        if (hitIndex !== -1) {
          const inv = s.invaders[hitIndex];
          s.invaders.splice(hitIndex, 1);
          s.score += (INVADER_ROWS - inv.row) * 10;
          s.particles.push({ x: inv.x, y: inv.y, ttl: 4 });
          playExplosionSound();
          continue; // cette balle est consommée par l'impact
        }

        remainingBullets.push(bullet);
      }
      s.bullets = remainingBullets;
      s.particles = s.particles
        .map((p) => ({ ...p, ttl: p.ttl - 1 }))
        .filter((p) => p.ttl > 0);

      // Déplacement des envahisseurs — accélère progressivement (sans à-coup) au fur et à mesure qu'il en reste moins
      if (s.invaders.length > 0) {
        const progress = 1 - s.invaders.length / TOTAL_INVADERS; // 0 au début, → 1 quand la vague est presque nettoyée
        const interval = INVADER_TICK_EVERY - (INVADER_TICK_EVERY - MIN_INVADER_TICK_EVERY) * progress;
        s.invaderMoveAcc += 1 / interval;

        if (s.invaderMoveAcc >= 1) {
          s.invaderMoveAcc -= 1;
          s.invaderFrame = s.invaderFrame === 0 ? 1 : 0;
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
      }

      // Conditions de fin
      if (s.invaders.length === 0) {
        s.won = true;
        s.gameOver = true;
        finalizeScore(s.score);
        playWinSound();
      } else if (s.invaders.some((inv) => inv.y >= PLAYER_ROW)) {
        if (s.lives > 1) {
          s.lives -= 1;
          s.invaders = makeInvaders();
          s.bullets = [];
          s.dir = 1;
        } else {
          s.lives = 0;
          s.gameOver = true;
          finalizeScore(s.score);
          playGameOverSound();
        }
      }

      forceRender((n) => n + 1);
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [active, finalizeScore]);

  // --- Rendu canvas ---
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = stateRef.current;

    // Fond étoilé
    ctx.fillStyle = '#00040d';
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
    ctx.fillStyle = '#94a3b8';
    starsRef.current.forEach((star) => {
      ctx.globalAlpha = 0.35 + 0.55 * Math.abs(Math.sin((s.tick + star.phase) / 8));
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    ctx.globalAlpha = 1;

    // Envahisseurs (sprite animé, couleur selon la rangée)
    const frame = INVADER_FRAMES[s.invaderFrame];
    const spriteRows = frame.length;
    const spriteCols = frame[0].length;
    const pad = 2;
    const box = CELL - pad * 2;
    const px = box / spriteCols;
    const py = box / spriteRows;

    s.invaders.forEach((inv) => {
      ctx.fillStyle = INVADER_ROW_COLORS[inv.row % INVADER_ROW_COLORS.length];
      const baseX = inv.x * CELL + pad;
      const baseY = inv.y * CELL + pad;
      for (let r = 0; r < spriteRows; r++) {
        for (let c = 0; c < spriteCols; c++) {
          if (frame[r][c] === '1') {
            ctx.fillRect(baseX + c * px, baseY + r * py, Math.ceil(px), Math.ceil(py));
          }
        }
      }
    });

    // Explosions
    s.particles.forEach((p) => {
      const alpha = p.ttl / 4;
      const cx = p.x * CELL + CELL / 2;
      const cy = p.y * CELL + CELL / 2;
      ctx.fillStyle = `rgba(250, 204, 21, ${alpha})`;
      ctx.beginPath();
      ctx.arc(cx, cy, (4 - p.ttl) * 2 + 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Vaisseau du joueur
    const shipX = s.playerX * CELL;
    const shipY = PLAYER_ROW * CELL;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(shipX + CELL / 2, shipY + 2);
    ctx.lineTo(shipX + CELL - 3, shipY + CELL - 3);
    ctx.lineTo(shipX + 3, shipY + CELL - 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(shipX + 3, shipY + CELL - 4, CELL - 6, 3);

    // Balles avec lueur
    s.bullets.forEach((bullet) => {
      const bx = bullet.x * CELL + CELL / 2;
      const by = bullet.y * CELL;
      ctx.shadowColor = '#f87171';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#f87171';
      ctx.fillRect(bx - 1, by, 2, CELL);
      ctx.shadowBlur = 0;
    });
  });

  if (!active) return null;

  const s = stateRef.current;
  const canFire = s.tick >= s.cooldownUntilTick;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
      <button
        onClick={close}
        className="absolute top-4 right-4 text-green-400 hover:text-green-200"
        aria-label="Fermer"
      >
        <X size={28} />
      </button>

      <div className="mb-2 flex items-center gap-4 font-mono text-green-400 text-sm tracking-widest">
        <span>SCORE: {s.score}</span>
        <span className="text-green-600">HI: {highScore}</span>
        <span className="flex items-center gap-1">
          {Array.from({ length: s.lives }).map((_, i) => (
            <span
              key={i}
              className="inline-block h-2.5 w-2.5 bg-yellow-400"
              style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
            />
          ))}
        </span>
        <span className={canFire ? 'text-green-400' : 'text-green-700'}>
          {canFire ? '● PRÊT' : '○ RECHARGE'}
        </span>
      </div>

      <div
        className="relative"
        style={{ boxShadow: '0 0 20px rgba(74,222,128,0.45), 0 0 45px rgba(74,222,128,0.15)' }}
      >
        <canvas
          ref={canvasRef}
          width={COLS * CELL}
          height={ROWS * CELL}
          style={{
            width: COLS * CELL * 2.25,
            height: ROWS * CELL * 2.25,
            imageRendering: 'pixelated',
            border: '2px solid #4ade80',
            display: 'block',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(rgba(0,0,0,0) 0px, rgba(0,0,0,0) 1px, rgba(0,0,0,0.25) 2px, rgba(0,0,0,0.25) 3px)',
            mixBlendMode: 'multiply',
          }}
        />
        {s.paused && !s.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 font-mono text-lg text-green-400">
            PAUSE
          </div>
        )}
      </div>

      {s.gameOver && (
        <div className="mt-4 flex flex-col items-center gap-2 font-mono text-green-400 text-lg">
          <span>{s.won ? 'GAGNÉ 👾' : 'GAME OVER'}</span>
          {s.score > 0 && s.score >= highScore && (
            <span className="text-xs text-yellow-400">NOUVEAU RECORD !</span>
          )}
          <button
            onClick={restart}
            className="rounded border border-green-400 px-4 py-1 text-sm text-green-400 hover:bg-green-400 hover:text-black transition-colors"
          >
            Rejouer (R)
          </button>
          <span className="text-xs text-green-600">Échap ou clique sur la croix pour fermer</span>
        </div>
      )}

      <div className="mt-3 font-mono text-green-600 text-xs">
        ← → bouger · Espace (maintenir) tirer · P pause
      </div>
    </div>
  );
}
