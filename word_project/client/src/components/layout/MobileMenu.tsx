import { useState, type ReactNode } from 'react'
import { Menu, X } from 'lucide-react'
import MusicPlayer from '../music/MusicPlayer'
import { useClickOutside } from '../../hooks/useClickOutside'

type Props = {
  /** Actions propres à la page (liens de navigation, déconnexion...). */
  children?: ReactNode
}

/**
 * Menu burger réservé au mobile (`sm:hidden`). Il accueille les éléments qui
 * n'ont pas leur place dans un header de 56px sur téléphone : le lecteur de
 * musique et les actions de navigation passées en `children`.
 * Sur desktop il est masqué — ces éléments restent affichés directement dans
 * le header.
 */
export default function MobileMenu({ children }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false))

  return (
    <div className="mobile-menu" ref={ref}>
      <button
        type="button"
        className="mobile-menu-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open && (
        <div className="mobile-menu-panel">
          <div className="mobile-menu-music">
            <MusicPlayer />
          </div>
          {children && (
            <div className="mobile-menu-actions" onClick={() => setOpen(false)}>
              {children}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
