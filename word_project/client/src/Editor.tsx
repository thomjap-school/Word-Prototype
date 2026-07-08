import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { HocuspocusProvider } from '@hocuspocus/provider'
import Toolbar from './Toolbar'
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { getDocument, updateDocumentTitle } from './documentService'

const randomColor = () =>
  `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`

function Editor() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const documentId = id ?? null // en collaboratif, l'id doit exister avant d'ouvrir l'éditeur

  const [title, setTitle] = useState('Document sans titre')
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [error, setError] = useState<string | null>(null)

  const { ydoc, provider } = useMemo(() => {
    if (!documentId) return { ydoc: null, provider: null }

    const ydoc = new Y.Doc()
    const provider = new HocuspocusProvider({
      url: import.meta.env.VITE_COLLAB_WS_URL,
      name: String(documentId), // room = id du document
      document: ydoc,
      token: localStorage.getItem('authToken') ?? undefined,
      onStatus: ({ status }) => setStatus(status),
    })

    return { ydoc, provider }
  }, [documentId])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: ydoc
      ? [
          StarterKit.configure({ history: false }),
          Underline,
          TextAlign.configure({ types: ['heading', 'paragraph'] }),
          Placeholder.configure({ placeholder: 'Commence à écrire ici...' }),
          Collaboration.configure({ document: ydoc }),
          CollaborationCursor.configure({
            provider,
            user: {
              name: currentUser?.name ?? 'Anonyme',
              color: randomColor(),
            },
          }),
        ]
      : [],
  }, [ydoc])

  useEffect(() => {
    if (!documentId) return
    getDocument(documentId)
      .then((doc) => setTitle(doc.title))
      .catch(() => setError('Impossible de charger le document'))
  }, [documentId])

  useEffect(() => {
    return () => {
      provider?.destroy()
      ydoc?.destroy()
    }
  }, [provider, ydoc])

  const handleTitleBlur = async () => {
    if (!documentId) return
    try {
      await updateDocumentTitle(documentId, title)
    } catch {
      setError('Erreur lors de la sauvegarde du titre')
    }
  }

  if (!editor || status === 'connecting') {
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
          {status === 'connected' ? 'Synchronisé' : 'Hors ligne'}
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