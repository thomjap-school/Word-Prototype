import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import * as Y from 'yjs'
import { HocuspocusProvider } from '@hocuspocus/provider'
import Toolbar from './Toolbar'
import ShareDialog from './Sharedialog'
import ExportImportMenu from './Exportimportmenu'
import { ArrowLeft, LoaderCircle, Users } from 'lucide-react'
import {
  getDocument,
  updateDocumentTitle,
  type Collaborator,
} from './documentService'

const WEBSOCKET_URL = import.meta.env.VITE_COLLAB_WS_URL || 'ws://localhost:1234'

const USER_COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#818cf8', '#f472b6']
const currentUser = {
  name: `Invité ${Math.floor(Math.random() * 1000)}`,
  color: USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)],
}

const TEMPLATES: Record<string, string> = {
  'Rapport': `
    <h1>Rapport de projet</h1>
    <h2>Introduction</h2>
    <p>Contexte et objectifs du projet...</p>
    <h2>Déroulement</h2>
    <p>Étapes réalisées...</p>
    <h2>Conclusion</h2>
    <p>Bilan et perspectives...</p>
  `,
  'Compte rendu': `
    <h1>Compte rendu de réunion</h1>
    <p><strong>Date :</strong> </p>
    <p><strong>Participants :</strong> </p>
    <h2>Ordre du jour</h2>
    <p></p>
    <h2>Décisions prises</h2>
    <p></p>
  `,
  'Mémo': `
    <h1>Mémo</h1>
    <p></p>
  `,
}

// Cache module-level : une room (ydoc + provider) par document, réutilisée
// tant que l'onglet vit. Même logique que le prototype (créé hors composant),
// mais indexé par documentId pour supporter plusieurs documents distincts,
// et pour survivre au double-montage de React.StrictMode en dev.
const rooms = new Map<string, { ydoc: Y.Doc; provider: HocuspocusProvider }>()

function getRoom(documentId: string) {
  let room = rooms.get(documentId)
  if (!room) {
    const ydoc = new Y.Doc()
    const provider = new HocuspocusProvider({
      url: `${WEBSOCKET_URL}?ngrok-skip-browser-warning=true`,
      name: `document-${documentId}`,
      document: ydoc,
    })
    room = { ydoc, provider }
    rooms.set(documentId, room)
  }
  return room
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

function Editor() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const state = location.state as { template?: string } | null

  // En collaboratif, il faut un id existant avant d'ouvrir l'éditeur
  // (le document doit être créé via l'API AVANT la navigation vers /editor/:id)
  useEffect(() => {
    if (!id) navigate('/')
  }, [id, navigate])

  const { ydoc, provider } = useMemo(
    () => (id ? getRoom(id) : { ydoc: null, provider: null }),
    [id]
  )

  const [title, setTitle] = useState('Document sans titre')
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [shareOpen, setShareOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Suit l'état réel de la connexion WebSocket
  useEffect(() => {
    if (!provider) return

    const handleStatus = ({
      status: connectionStatus,
    }: {
      status: ConnectionStatus
    }) => {
      setStatus(connectionStatus)
    }

    provider.on('status', handleStatus)

    return () => {
      provider.off('status', handleStatus)
    }
  }, [provider])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: ydoc
      ? [
          StarterKit.configure({ undoRedo: false }), // historique géré par Yjs
          TextAlign.configure({ types: ['heading', 'paragraph'] }),
          Placeholder.configure({ placeholder: 'Commence à écrire ici...' }),
          Collaboration.configure({ document: ydoc }),
          CollaborationCaret.configure({ provider, user: currentUser }),
        ]
      : [],
  }, [ydoc])

  // Le titre et les collaborateurs restent gérés via l'API REST classique —
  // seul le contenu transite désormais par Yjs / la connexion WebSocket
  useEffect(() => {
    if (!id || !editor) return
    getDocument(Number(id))
      .then((doc) => {
        setTitle(doc.title)
        setCollaborators(doc.collaborators)
        // Pré-remplissage local si un modèle a été choisi et que le document
        // vient d'être créé (personne n'a encore écrit dedans via Yjs)
        if (state?.template && TEMPLATES[state.template] && editor.isEmpty) {
          editor.commands.setContent(TEMPLATES[state.template])
        } else if (doc.content && editor.isEmpty) {
          editor.commands.setContent(doc.content)
        }
      })
      .catch(() => setError('Impossible de charger le document'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editor])

  const handleTitleBlur = async () => {
    if (!id) return
    try {
      await updateDocumentTitle(Number(id), title)
    } catch {
      setError('Erreur lors de la sauvegarde du titre')
    }
  }

  if (!editor) {
    return (
      <div className="page-shell flex items-center justify-center min-h-screen">
        <LoaderCircle className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="editor-topbar">
        <button onClick={() => navigate('/')} className="editor-back-btn">
          <ArrowLeft size={15} />
          Retour
        </button>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="editor-title-input"
        />

        <div className="editor-actions">
          <span className={`editor-status editor-status--${status}`}>
            {status === 'connected' ? 'Synchronisé' : status === 'connecting' ? 'Connexion...' : 'Hors ligne'}
          </span>

          <ExportImportMenu editor={editor} title={title} />

          {id && (
            <button
              onClick={() => setShareOpen(true)}
              className="toolbar-action-btn"
            >
              <Users size={14} />
              Partager
              {collaborators.length > 0 && (
                <span className="share-count-badge">
                  {collaborators.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert--error mx-auto max-w-3xl mt-4">
          {error}
        </div>
      )}

      <div className="editor-frame">
        <Toolbar editor={editor} />
        <div className="editor-body">
          <EditorContent editor={editor} className="tiptap prose max-w-none focus:outline-none" />
        </div>
      </div>

      {shareOpen && id && (
        <ShareDialog
          documentId={Number(id)}
          collaborators={collaborators}
          onClose={() => setShareOpen(false)}
          onCollaboratorsChange={setCollaborators}
        />
      )}
    </div>
  )
}

export default Editor
