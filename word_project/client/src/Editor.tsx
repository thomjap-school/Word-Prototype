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
    <div className="min-h-screen bg-gray-50">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 h-12 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft size={15} />
          Retour
        </button>

        <input
          type="text"
          defaultValue="Document sans titre"
          className="text-sm font-medium text-gray-900 bg-transparent border-none outline-none text-center w-64"
        />

        <button className="flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 h-8 rounded-lg transition">
          <Save size={14} />
          Enregistrer
        </button>
      </div>

      {/* Editor */}
      <div className="max-w-3xl mx-auto mt-8 mb-16 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <Toolbar editor={editor} />
        <div className="p-10 min-h-[700px]">
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
