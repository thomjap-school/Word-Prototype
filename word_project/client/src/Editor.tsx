import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import Toolbar from './Toolbar'
import Underline from '@tiptap/extension-underline'

function Editor() {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: 'Commence à écrire ici...',
      }),
    ],
    content: '',
  })

  if (!editor) {
    return null
  }

  return (
  <div className="max-w-3xl mx-auto mt-10 bg-white shadow-lg rounded-lg overflow-hidden">

    <Toolbar editor={editor} />

    <div className="p-8 min-h-[800px] bg-gray-50">
      <EditorContent
        editor={editor}
        className="tiptap prose max-w-none focus:outline-none"
      />
    </div>

  </div>
)
}

export default Editor