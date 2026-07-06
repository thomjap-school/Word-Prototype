import { useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Toolbar from './Toolbar'
import { ArrowLeft, Save } from 'lucide-react'

function Editor() {
  const navigate = useNavigate()

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
          defaultValue="Document sans titre"
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
