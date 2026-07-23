import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
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

interface MusicPlayerContextValue {
  tracks: NcsTrack[]
  track: NcsTrack
  isPlaying: boolean
  currentTime: number
  duration: number
  togglePlay: () => void
  next: () => void
  prev: () => void
  seek: (value: number) => void
  selectTrack: (t: NcsTrack) => void
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null)

// Monté une seule fois au-dessus des <Routes> (voir App.tsx) : l'élément
// <audio> qu'il porte ne démonte donc jamais lors de la navigation, ce qui
// permet à la musique de continuer de jouer d'une page à l'autre.
export function MusicPlayerProvider({ children }: { children: ReactNode }) {
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

  const track = tracks[index]

  const value: MusicPlayerContextValue = {
    tracks,
    track,
    isPlaying,
    currentTime,
    duration,
    togglePlay: () => setIsPlaying((p) => !p),
    next: () => setIndex((i) => (i + 1) % tracks.length),
    prev: () => setIndex((i) => (i - 1 + tracks.length) % tracks.length),
    seek: (value) => {
      setCurrentTime(value)
      if (audioRef.current) audioRef.current.currentTime = value
    },
    selectTrack: (t) => {
      const i = tracks.indexOf(t)
      if (i === -1) return
      setIndex(i)
      setIsPlaying(true)
    },
  }

  return (
    <MusicPlayerContext.Provider value={value}>
      <audio
        ref={audioRef}
        src={track.url}
        onEnded={value.next}
        onError={value.next}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />
      {children}
    </MusicPlayerContext.Provider>
  )
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext)
  if (!ctx) throw new Error('useMusicPlayer must be used within a MusicPlayerProvider')
  return ctx
}
