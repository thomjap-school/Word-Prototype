import { useNavigate } from 'react-router-dom'
import { Search, FileText, Plus, Clock, ArrowRight, FileCheck, ClipboardList, AlignLeft } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()

  const documents = [
    { id: 1, title: 'Rapport de projet', updated: "Aujourd'hui à 10:45", isRecent: true },
    { id: 2, title: 'Compte rendu réunion', updated: 'Hier à 17:20', isRecent: false },
    { id: 3, title: 'Notes personnelles', updated: '22 juin 2026', isRecent: false },
  ]

  const templates = [
    { label: 'Document vide', icon: Plus, featured: true },
    { label: 'Rapport', icon: FileCheck, featured: false },
    { label: 'Compte rendu', icon: ClipboardList, featured: false },
    { label: 'Mémo', icon: AlignLeft, featured: false },
  ]

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

        <div className="search-box">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Rechercher un document..."
            className="search-input"
          />
        </div>

        <div className="user-avatar">
          EM
        </div>

      </header>

      {/* Main */}
      <main className="home-main">

        {/* Nouveau document */}
        <p className="section-label">
          Nouveau document
        </p>

        <div className="template-grid">
          {templates.map(({ label, icon: Icon, featured }) => (
            <div
              key={label}
              onClick={() => navigate('/editor')}
              className={`template-card ${featured ? 'template-card--featured' : ''}`}
            >
              <Icon size={22} className={featured ? 'template-icon--featured' : 'template-icon'} />
              <span className="template-label">{label}</span>
            </div>
          ))}
        </div>

        <hr className="border-gray-200 mb-8" />

        {/* Documents récents */}
        <p className="section-label section-label--tight">
          Documents récents
        </p>

        <div className="doc-list">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => navigate('/editor')}
              className="doc-item group"
            >

              <div className="doc-icon-wrap">
                <FileText size={17} className="text-blue-500" />
              </div>

              <div className="doc-info">
                <p className="doc-title">{doc.title}</p>
                <div className="doc-meta">
                  <Clock size={11} />
                  {doc.updated}
                </div>
              </div>

              {doc.isRecent && (
                <span className="doc-badge">
                  Récent
                </span>
              )}

              <div className="doc-open">
                <ArrowRight size={13} />
                Ouvrir
              </div>

            </div>
          ))}
        </div>

      </main>

    </div>
  )
}