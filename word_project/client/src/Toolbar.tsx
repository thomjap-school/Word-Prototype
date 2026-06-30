import { Editor } from '@tiptap/react'

type Props = {
  editor: Editor | null
}

export default function Toolbar({ editor }: Props) {
  if (!editor) return null

  return (
    <div className="flex gap-2 p-2 bg-gray-100 border-b">

      <button onClick={() => editor.chain().focus().toggleBold().run()}>
        B
      </button>

      <button onClick={() => editor.chain().focus().toggleItalic().run()}>
        I
      </button>

      <button onClick={() => editor.chain().focus().toggleUnderline().run()}>
        U
      </button>

      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        H1
      </button>

      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </button>

      <button onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • List
      </button>

    </div>
  )
}
