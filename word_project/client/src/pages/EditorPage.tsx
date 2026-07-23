import { useNavigate } from 'react-router-dom'
import Editor from '../components/editor/Editor'
import MusicPlayer from '../components/music/MusicPlayer'
import MobileMenu from '../components/layout/MobileMenu'
import { FileText, LogOut, User } from 'lucide-react'
import { useLogout } from '../hooks/useLogout'
import { initialsFromName } from '../utils/initials'

export default function EditorPage() {
  const navigate = useNavigate()
  const handleLogout = useLogout()
  const fullName = localStorage.getItem('fullName') || 'Invité'
  const initials = initialsFromName(fullName)

  return (
    <div className="page-shell">

      {/* Header */}
      <header className="app-header app-header--between">
        <div className="app-logo">
          <div className="app-logo-icon">
            <FileText size={14} className="text-white" />
          </div>
          <span className="app-logo-text">Word Prototype</span>
        </div>

        <div className="app-header-center">
          <MusicPlayer />
        </div>

        <div className="home-header-actions">
          <button onClick={handleLogout} className="logout-btn hidden sm:flex" title="Se déconnecter">
            <LogOut size={14} />
            <span className="btn-label">Déconnexion</span>
          </button>
          <div
            className="user-avatar hidden sm:flex"
            onClick={() => navigate('/profile')}
            title={fullName}
          >
            {initials}
          </div>

          <MobileMenu>
            <button className="mobile-menu-item" onClick={() => navigate('/profile')}>
              <User size={15} />
              Mon profil
            </button>
            <button className="mobile-menu-item mobile-menu-item--danger" onClick={handleLogout}>
              <LogOut size={15} />
              Déconnexion
            </button>
          </MobileMenu>
        </div>
      </header>

      {/* Editor */}
      <Editor />

    </div>
  )
}
