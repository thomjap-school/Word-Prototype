import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, Plus, Clock, ArrowRight, FileCheck, ClipboardList, AlignLeft, LogOut, Trash2 } from 'lucide-react'
import { logout } from './authService'
import { listDocuments, deleteDocument, type DocumentSummary } from './documentService'

const TEMPLATE_TITLES: Record<string, string> = {
  'Document vide': 'Document sans titre',
  'Rapport': 'Rapport de projet',
  'Compte rendu': 'Compte rendu de réunion',
  'Mémo': 'Mémo',
}

export default function Home() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listDocuments()
      .then(setDocuments)
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleTemplateClick = (label: string) => {
    navigate('/editor/new', {
      state: { template: label, title: TEMPLATE_TITLES[label] ?? 'Document sans titre' },
    })
  }

  const handleDelete = async (e: React.MouseEvent, docId: number) => {
    e.stopPropagation()
    if (!confirm('Supprimer ce document ? Cette action est irréversible.')) return
    await deleteDocument(docId)
    setDocuments((docs) => docs.filter((d) => d.id !== docId))
  }

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
            <FileText size={14} />
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

        <div className="home-header-actions">
          <button onClick={handleLogout} className="logout-btn" title="Se déconnecter">
            <LogOut size={14} />
            Déconnexion
          </button>
          <div className="user-avatar" onClick={() => navigate('/profile')} title="Mon profil">
            EM
          </div>
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
              onClick={() => handleTemplateClick(label)}
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
              onClick={() => navigate(`/editor/${doc.id}`)}
              className="doc-item group"
            >

              <div className="doc-icon-wrap">
                <FileText size={17} className="text-blue-500" />
              </div>

              <div className="doc-info">
                <p className="doc-title">{doc.title}</p>
                <div className="doc-meta">
                  <Clock size={11} />
                  {new Date(doc.updated_at ?? doc.created_at).toLocaleString('fr-FR')}
                </div>
              </div>

              <div className="doc-open">
                <ArrowRight size={13} />
                Ouvrir
              </div>

              <button
                onClick={(e) => handleDelete(e, doc.id)}
                title="Supprimer"
                className="doc-delete-btn"
              >
                <Trash2 size={14} />
              </button>

            </div>
          ))}

          {!loading && documents.length === 0 && (
            <p className="text-sm text-gray-400 italic px-3 py-2">
              Aucun document pour l'instant.
            </p>
          )}
        </div>

      </main>

    </div>
  )
}
