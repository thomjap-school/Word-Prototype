import { Editor } from '@tiptap/react'

type Props = {
  editor: Editor | null
}

export default function Toolbar({ editor }: Props) {
  if (!editor) return null

  const btnClass = (active: boolean) =>
    `px-2 py-1 rounded text-sm ${
      active ? 'bg-green-600 text-white' : 'bg-gray-200'
    }`

  return (
    <div className="flex gap-2 p-2 border-b bg-white">

      {/* Bold */}
      <button
        className={btnClass(editor.isActive('bold'))}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </button>

      {/* Italic */}
      <button
        className={btnClass(editor.isActive('italic'))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        I
      </button>

      {/* Underline */}
      <button
        className={btnClass(editor.isActive('underline'))}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        U
      </button>

      {/* H1 */}
      <button
        className={btnClass(editor.isActive('heading', { level: 1 }))}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        H1
      </button>

      {/* H2 */}
      <button
        className={btnClass(editor.isActive('heading', { level: 2 }))}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        H2
      </button>

      {/* List */}
      <button
        className={btnClass(editor.isActive('bulletList'))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </button>

    </div>
  )
}
