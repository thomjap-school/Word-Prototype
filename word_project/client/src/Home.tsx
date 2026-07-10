import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, Plus, Clock, ArrowRight, FileCheck, ClipboardList, AlignLeft, LoaderCircle } from 'lucide-react'
import { listDocuments, createDocument, type DocumentSummary } from './documentService'

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function Home() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/visitor`, {
      method: "POST",
    }).catch(() => {})

    listDocuments()
      .then(setDocuments)
      .catch(() => setError('Impossible de charger les documents'))
      .finally(() => setLoading(false))
  }, [])

  const templates = [
    { label: 'Document vide', icon: Plus, featured: true },
    { label: 'Rapport', icon: FileCheck, featured: false },
    { label: 'Compte rendu', icon: ClipboardList, featured: false },
    { label: 'Mémo', icon: AlignLeft, featured: false },
  ]

  const handleCreate = async (label: string) => {
    if (creating) return
    setCreating(true)
    setError(null)
    try {
      const doc = await createDocument(label)
      navigate(`/editor/${doc.id}`)
    } catch {
      setError('Impossible de créer le document')
      setCreating(false)
    }
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
              onClick={() => handleCreate(label)}
              className={`template-card ${featured ? 'template-card--featured' : ''} ${creating ? 'opacity-50 pointer-events-none' : ''}`}
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

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
            <LoaderCircle size={14} className="animate-spin" />
            Chargement...
          </div>
        )}

        {error && <p className="text-sm text-red-500 py-2">{error}</p>}

        {!loading && !error && documents.length === 0 && (
          <p className="text-sm text-gray-400 py-4">Aucun document pour le moment.</p>
        )}

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
                  {formatDate(doc.updated_at || doc.created_at)}
                </div>
              </div>

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