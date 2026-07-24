import { useState } from 'react'
import {
  Music2,
  Pause,
  Play,
  Search,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useMusicPlayer } from './MusicPlayerContext'
import type { NcsTrack } from './ncsTracks'
import { useClickOutside } from '../../hooks/useClickOutside'

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MusicPlayer() {
  const {
    tracks,
    track,
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    selectTrack,
  } = useMusicPlayer()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useClickOutside<HTMLDivElement>(() => setSearchOpen(false))

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value))
  }

  // Le mute prime sur la valeur du curseur ; l'icône reflète le niveau réel.
  const effectiveVolume = muted ? 0 : volume
  const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2

  const handleSelect = (t: NcsTrack) => {
    selectTrack(t)
    setSearchOpen(false)
    setQuery('')
  }

  const q = query.trim().toLowerCase()
  const filtered = q
    ? tracks.filter((t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q))
    : tracks

  return (
    <div className="music-player">
      <div className="music-player-row">
        <button onClick={prev} className="music-player-btn" aria-label="Piste précédente" title="Piste précédente">
          <SkipBack size={13} />
        </button>

        <button
          onClick={togglePlay}
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

        <div className="music-volume">
          <button
            onClick={toggleMute}
            className="music-player-btn"
            aria-label={muted ? 'Réactiver le son' : 'Couper le son'}
            title={muted ? 'Réactiver le son' : 'Couper le son'}
          >
            <VolumeIcon size={13} />
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={effectiveVolume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="music-player-range music-volume-range"
            aria-label="Volume"
          />
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
                    onClick={() => handleSelect(t)}
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
