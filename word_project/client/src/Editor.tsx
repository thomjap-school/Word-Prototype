import { useEffect, useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Toolbar from './Toolbar'
import ShareDialog from './Sharedialog'
import ExportImportMenu from './Exportimportmenu'
import { ArrowLeft, Save, LoaderCircle, Users } from 'lucide-react'
import {
  getDocument,
  createDocument,
  updateDocumentTitle,
  updateDocumentContent,
  type Collaborator,
} from './documentService'

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

function Editor() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id?: string }>()
  const isNew = id === undefined // route /editor/new, pas encore créé côté serveur

  const state = location.state as { template?: string; title?: string } | null

  const [title, setTitle] = useState(state?.title ?? 'Document sans titre')
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

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

  // Nouveau document : pré-remplissage local uniquement, rien envoyé au serveur
  useEffect(() => {
    if (!editor || !isNew) return
    if (state?.template && TEMPLATES[state.template]) {
      editor.commands.setContent(TEMPLATES[state.template])
    }
  }, [editor, isNew, state?.template])

  // Document existant : chargement réel depuis l'API
  useEffect(() => {
    if (!editor || isNew || !id) return
    getDocument(Number(id)).then((doc) => {
      setTitle(doc.title)
      setCollaborators(doc.collaborators)
      if (doc.content) editor.commands.setContent(doc.content)
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, isNew, id])

  const handleSave = async () => {
    if (!editor) return
    setSaving(true)
    try {
      if (isNew) {
        // Première sauvegarde : création réelle du document
        const created = await createDocument(title)
        await updateDocumentContent(created.id, editor.getJSON())
        navigate(`/editor/${created.id}`, { replace: true })
      } else if (id) {
        await Promise.all([
          updateDocumentTitle(Number(id), title),
          updateDocumentContent(Number(id), editor.getJSON()),
        ])
      }
    } finally {
      setSaving(false)
    }
  }

  if (!editor || loading) return null

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

        <div className="flex items-center gap-2">
          <ExportImportMenu editor={editor} title={title} />

          {!isNew && id && (
            <button
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition px-3 h-8 rounded-lg border border-gray-200"
            >
              <Users size={14} />
              Partager
              {collaborators.length > 0 && (
                <span className="text-xs bg-gray-100 rounded-full px-1.5">
                  {collaborators.length}
                </span>
              )}
            </button>
          )}

          <button onClick={handleSave} disabled={saving} className="editor-save-btn">
            {saving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
            Enregistrer
          </button>
        </div>
      </div>

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

      {shareOpen && !isNew && id && (
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
