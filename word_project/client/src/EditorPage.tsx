import { useNavigate } from 'react-router-dom'
import Editor from './Editor'
import MusicPlayer from './MusicPlayer'
import { FileText, LogOut } from 'lucide-react'
import { logout } from './authService'

export default function EditorPage() {
  const navigate = useNavigate()
  const fullName = localStorage.getItem('fullName') || 'Invité'
  const initials = fullName
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

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
          <button onClick={handleLogout} className="logout-btn" title="Se déconnecter">
            <LogOut size={14} />
            Déconnexion
          </button>
          <div
            className="user-avatar"
            onClick={() => navigate('/profile')}
            title={fullName}
          >
            {initials}
          </div>
        </div>
      </header>

      {/* Editor */}
      <Editor />

    </div>
  )
}
