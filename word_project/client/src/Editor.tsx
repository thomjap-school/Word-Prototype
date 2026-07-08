import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Toolbar from './Toolbar'
import { ArrowLeft, Save, LoaderCircle } from 'lucide-react'
import { getDocument, createDocument, updateDocument } from './documentService'

function Editor() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const documentId = id ? Number(id) : null

  const [title, setTitle] = useState('Document sans titre')
  const [currentId, setCurrentId] = useState<number | null>(documentId)
  const [loading, setLoading] = useState(!!documentId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder: 'Commence à écrire ici...',
      }),
    ],
    content: '',
  })

  // Charger le document existant si on a un id dans l'URL
  useEffect(() => {
    if (!documentId || !editor) return

    getDocument(documentId)
      .then((doc) => {
        setTitle(doc.title)
        if (doc.content) {
          editor.commands.setContent(doc.content)
        }
      })
      .catch(() => setError('Impossible de charger le document'))
      .finally(() => setLoading(false))
  }, [documentId, editor])

  const handleSave = useCallback(async () => {
    if (!editor) return
    setSaving(true)
    setError(null)
    try {
      const content = editor.getJSON()
      if (currentId) {
        await updateDocument(currentId, { title, content })
      } else {
        const created = await createDocument(title, content)
        setCurrentId(created.id)
        // Met à jour l'URL sans recharger la page
        navigate(`/editor/${created.id}`, { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }, [editor, currentId, title, navigate])

  if (!editor || loading) {
    return (
      <div className="page-shell flex items-center justify-center min-h-screen">
        <LoaderCircle className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="page-shell">

      {/* Top bar */}
      <div className="editor-topbar">
        <button
          onClick={() => navigate('/')}
          className="editor-back-btn"
        >
          <ArrowLeft size={15} />
          Retour
        </button>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="editor-title-input"
        />

        <button className="editor-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
          Enregistrer
        </button>
      </div>

      {error && (
        <div className="alert alert--error mx-auto max-w-3xl mt-4">
          {error}
        </div>
      )}

      {/* Editor */}
      <div className="editor-frame">
        <Toolbar editor={editor} />
        <div className="editor-body">
          <EditorContent
            editor={editor}
            className="tiptap prose max-w-none focus:outline-none"
          />
        </div>
      </div>

    </div>
  )
}

export default Editor