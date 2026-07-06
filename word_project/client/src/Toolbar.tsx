import { Editor } from '@tiptap/react'
import {
  Bold, Italic, Underline, List, Heading1, Heading2,
  Strikethrough, AlignLeft, AlignCenter, AlignRight, Undo, Redo
} from 'lucide-react'

type Props = {
  editor: Editor | null
}

export default function Toolbar({ editor }: Props) {
  if (!editor) return null

  const btn = (active: boolean) =>
    `toolbar-btn ${active ? 'toolbar-btn--active' : ''}`

  return (
    <div className="toolbar">

      {/* Undo / Redo */}
      <button className={btn(false)} onClick={() => editor.chain().focus().undo().run()} title="Annuler">
        <Undo size={15} />
      </button>
      <button className={btn(false)} onClick={() => editor.chain().focus().redo().run()} title="Rétablir">
        <Redo size={15} />
      </button>

      <div className="toolbar-divider" />

      {/* Headings */}
      <button
        className={btn(editor.isActive('heading', { level: 1 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Titre 1"
      >
        <Heading1 size={15} />
      </button>
      <button
        className={btn(editor.isActive('heading', { level: 2 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Titre 2"
      >
        <Heading2 size={15} />
      </button>

      <div className="toolbar-divider" />

      {/* Text style */}
      <button
        className={btn(editor.isActive('bold'))}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Gras"
      >
        <Bold size={15} />
      </button>
      <button
        className={btn(editor.isActive('italic'))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italique"
      >
        <Italic size={15} />
      </button>
      <button
        className={btn(editor.isActive('underline'))}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Souligné"
      >
        <Underline size={15} />
      </button>
      <button
        className={btn(editor.isActive('strike'))}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Barré"
      >
        <Strikethrough size={15} />
      </button>

      <div className="toolbar-divider" />

      {/* Lists */}
      <button
        className={btn(editor.isActive('bulletList'))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Liste à puces"
      >
        <List size={15} />
      </button>

      <div className="toolbar-divider" />

      {/* Alignment */}
      <button
        className={btn(editor.isActive({ textAlign: 'left' }))}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        title="Aligner à gauche"
      >
        <AlignLeft size={15} />
      </button>
      <button
        className={btn(editor.isActive({ textAlign: 'center' }))}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        title="Centrer"
      >
        <AlignCenter size={15} />
      </button>
      <button
        className={btn(editor.isActive({ textAlign: 'right' }))}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        title="Aligner à droite"
      >
        <AlignRight size={15} />
      </button>

    </div>
  )
}
