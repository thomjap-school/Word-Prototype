import { useNavigate, useLocation } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Toolbar from './Toolbar'
import { ArrowLeft, Save } from 'lucide-react'

const TEMPLATES: Record<string, { title: string; content: string }> = {
  'Rapport': {
    title: 'Rapport de projet',
    content: `
      <h1>Rapport de projet</h1>
      <h2>Introduction</h2>
      <p>Contexte et objectifs du projet...</p>
      <h2>Déroulement</h2>
      <p>Étapes réalisées...</p>
      <h2>Conclusion</h2>
      <p>Bilan et perspectives...</p>
    `,
  },
  'Compte rendu': {
    title: 'Compte rendu de réunion',
    content: `
      <h1>Compte rendu de réunion</h1>
      <p><strong>Date :</strong> </p>
      <p><strong>Participants :</strong> </p>
      <h2>Ordre du jour</h2>
      <p></p>
      <h2>Décisions prises</h2>
      <p></p>
    `,
  },
  'Mémo': {
    title: 'Mémo',
    content: `
      <h1>Mémo</h1>
      <p></p>
    `,
  },
}

function Editor() {
  const navigate = useNavigate()
  const location = useLocation()
  const templateName = (location.state as { template?: string } | null)?.template
  const template = templateName ? TEMPLATES[templateName] : undefined

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
    content: template?.content ?? '',
  })

  if (!editor) return null

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
          defaultValue={template?.title ?? 'Document sans titre'}
          className="editor-title-input"
        />

        <button className="editor-save-btn">
          <Save size={14} />
          Enregistrer
        </button>
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

    </div>
  )
}

export default Editor
