import { useEffect, useRef, useState } from 'react'
import { Music2, Pause, Play, Search, SkipBack, SkipForward } from 'lucide-react'
import { NCS_TRACKS, type NcsTrack } from './ncsTracks'

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
  const searchRef = useRef<HTMLDivElement>(null)

  const [tracks] = useState(() => shuffle(NCS_TRACKS))
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const next = () => setIndex((i) => (i + 1) % tracks.length)
  const prev = () => setIndex((i) => (i - 1 + tracks.length) % tracks.length)

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    setCurrentTime(value)
    if (audioRef.current) audioRef.current.currentTime = value
  }

  const selectTrack = (t: NcsTrack) => {
    const i = tracks.indexOf(t)
    if (i === -1) return
    setIndex(i)
    setIsPlaying(true)
    setSearchOpen(false)
    setQuery('')
  }

  const q = query.trim().toLowerCase()
  const filtered = q
    ? tracks.filter((t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q))
    : tracks

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

        <div className="music-search-wrap" ref={searchRef}>
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="music-player-btn"
            aria-label="Rechercher un titre"
            title="Rechercher un titre"
          >
            <Search size={13} />
          </button>

          {searchOpen && (
            <div className="music-search-popover">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un titre ou un artiste..."
                className="music-search-input"
                autoFocus
              />
              <div className="music-search-results">
                {filtered.length === 0 && (
                  <div className="music-search-empty">Aucun résultat</div>
                )}
                {filtered.map((t) => (
                  <button
                    key={t.url}
                    onClick={() => selectTrack(t)}
                    className={`music-search-item ${t.url === track.url ? 'music-search-item--active' : ''}`}
                  >
                    <span className="music-search-item-title">{t.title}</span>
                    <span className="music-search-item-artist">{t.artist}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
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
