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
import { getDocument, updateDocumentTitle, updateDocumentContent } from './documentService'
import { getCurrentUser } from './authService'

const randomColor = () =>
  `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`

function Editor() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const documentId = id ?? null

  const [title, setTitle] = useState('Document sans titre')
  const [content, setContent] = useState<any>(null)
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{ name?: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

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
    content,
    extensions: [
      StarterKit.configure({ history: true }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Commence à écrire ici...' }),
    ],
  }, [content])

  useEffect(() => {
    if (!documentId) return
    Promise.all([
      getDocument(documentId).then((doc) => {
        setTitle(doc.title)
        setContent(doc.content)
        setIsSaving(true)
      }),
      getCurrentUser().then((user) => setCurrentUser(user)).catch(() => null),
    ]).catch(() => setError('Impossible de charger le document'))
  }, [documentId])

  useEffect(() => {
    return () => {
      provider?.destroy()
      ydoc?.destroy()
    }
  }, [provider, ydoc])

  // Auto-save all 100ms
  useEffect(() => {
    if (!documentId || !editor || !isSaving) return

    const interval = setInterval(() => {
      updateDocumentContent(documentId, editor.getJSON()).catch(() =>
        setError('Erreur lors de la sauvegarde')
      )
    }, 100)

    return () => clearInterval(interval)
  }, [editor, documentId, isSaving])

  const handleTitleBlur = async () => {
    if (!documentId) return
    try {
      await updateDocumentTitle(documentId, title)
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
          Local
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