import { useEffect, useRef, useState } from 'react'
import { Music2, Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { NCS_TRACKS } from './ncsTracks'

// Ordre mélangé une fois par montage, pour ne pas toujours démarrer sur le
// même titre tout en gardant un ordre stable pendant la session.
function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)

  const [tracks] = useState(() => shuffle(NCS_TRACKS))
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying, index])

  // Repart de zéro à chaque changement de piste, sinon l'ancien temps reste
  // affiché le temps que les métadonnées du nouveau morceau se chargent.
  useEffect(() => {
    setCurrentTime(0)
    setDuration(0)
  }, [index])

  const next = () => setIndex((i) => (i + 1) % tracks.length)
  const prev = () => setIndex((i) => (i - 1 + tracks.length) % tracks.length)

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    setCurrentTime(value)
    if (audioRef.current) audioRef.current.currentTime = value
  }

  const track = tracks[index]

  return (
    <div className="music-player">
      <audio
        ref={audioRef}
        src={track.url}
        onEnded={next}
        onError={next}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />

      <div className="music-player-row">
        <button onClick={prev} className="music-player-btn" aria-label="Piste précédente" title="Piste précédente">
          <SkipBack size={13} />
        </button>

        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="music-player-btn music-player-btn--play"
          aria-label={isPlaying ? 'Pause' : 'Lecture'}
          title={isPlaying ? 'Pause' : 'Lecture'}
        >
          {isPlaying ? <Pause size={13} /> : <Play size={13} />}
        </button>

        <button onClick={next} className="music-player-btn" aria-label="Piste suivante" title="Piste suivante">
          <SkipForward size={13} />
        </button>

        <div className="music-player-info" title={`${track.title} — ${track.artist} (NCS)`}>
          <Music2 size={12} className="text-gray-400 shrink-0" />
          <span className="music-player-track">
            {track.title} <span className="music-player-artist">— {track.artist}</span>
          </span>
        </div>
      </div>

      <div className="music-player-seek">
        <span className="music-player-time">{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="music-player-range"
          aria-label="Avancer / reculer dans la musique"
        />
        <span className="music-player-time">{formatTime(duration)}</span>
      </div>
    </div>
  )
}
