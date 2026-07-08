import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import Toolbar from './Toolbar'
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { getDocument, updateDocumentTitle } from './documentService'

const WEBSOCKET_URL = import.meta.env.VITE_COLLAB_WS_URL || 'ws://localhost:1234'

const USER_COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#818cf8', '#f472b6']
const currentUser = {
  name: `Invité ${Math.floor(Math.random() * 1000)}`,
  color: USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)],
}

// Cache module-level : une room (ydoc + provider) par document, réutilisée
// tant que l'onglet vit. Même logique que le prototype (créé hors composant),
// mais indexé par documentId pour supporter plusieurs documents distincts,
// et pour survivre au double-montage de React.StrictMode en dev.
const rooms = new Map<string, { ydoc: Y.Doc; provider: WebsocketProvider }>()

function getRoom(documentId: string) {
  let room = rooms.get(documentId)
  if (!room) {
    const ydoc = new Y.Doc()
    const provider = new WebsocketProvider(WEBSOCKET_URL, `document-${documentId}`, ydoc)
    room = { ydoc, provider }
    rooms.set(documentId, room)
  }
  return room
}

function Editor() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

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
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [error, setError] = useState<string | null>(null)

  // Suit l'état réel de la connexion WebSocket
  useEffect(() => {
    if (!provider) return
    const handleStatus = ({ status }: { status: typeof status }) => setStatus(status)
    provider.on('status', handleStatus)
    return () => provider.off('status', handleStatus)
  }, [provider])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: ydoc
      ? [
          StarterKit.configure({ undoRedo: false }), // historique géré par Yjs
          Underline,
          TextAlign.configure({ types: ['heading', 'paragraph'] }),
          Placeholder.configure({ placeholder: 'Commence à écrire ici...' }),
          Collaboration.configure({ document: ydoc }),
          CollaborationCaret.configure({ provider, user: currentUser }),
        ]
      : [],
  }, [ydoc])

  // Le titre reste géré via ton API REST classique — seul le contenu
  // transite désormais par Yjs / la connexion WebSocket
  useEffect(() => {
    if (!id) return
    getDocument(Number(id))
      .then((doc) => setTitle(doc.title))
      .catch(() => setError('Impossible de charger le document'))
  }, [id])

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

        <span className={`editor-status editor-status--${status}`}>
          {status === 'connected' ? 'Synchronisé' : status === 'connecting' ? 'Connexion...' : 'Hors ligne'}
        </span>
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
    </div>
  )
}

export default Editor