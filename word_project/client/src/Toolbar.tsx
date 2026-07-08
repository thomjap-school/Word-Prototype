import { Editor, useEditorState } from '@tiptap/react'
import {
  Bold, Italic, Underline, List, Heading1, Heading2,
  Strikethrough, AlignLeft, AlignCenter, AlignRight, Undo, Redo
} from 'lucide-react'

type Props = {
  editor: Editor | null
}

export default function Toolbar({ editor }: Props) {
  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return null
      return {
        isHeading1: ctx.editor.isActive('heading', { level: 1 }),
        isHeading2: ctx.editor.isActive('heading', { level: 2 }),
        isBold: ctx.editor.isActive('bold'),
        isItalic: ctx.editor.isActive('italic'),
        isUnderline: ctx.editor.isActive('underline'),
        isStrike: ctx.editor.isActive('strike'),
        isBulletList: ctx.editor.isActive('bulletList'),
        isAlignLeft: ctx.editor.isActive({ textAlign: 'left' }),
        isAlignCenter: ctx.editor.isActive({ textAlign: 'center' }),
        isAlignRight: ctx.editor.isActive({ textAlign: 'right' }),
      }
    },
  })

  if (!editor || !editorState) return null

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
        className={btn(editorState.isHeading1)}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Titre 1"
      >
        <Heading1 size={15} />
      </button>
      <button
        className={btn(editorState.isHeading2)}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Titre 2"
      >
        <Heading2 size={15} />
      </button>

      <div className="toolbar-divider" />

      {/* Text style */}
      <button
        className={btn(editorState.isBold)}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Gras"
      >
        <Bold size={15} />
      </button>
      <button
        className={btn(editorState.isItalic)}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italique"
      >
        <Italic size={15} />
      </button>
      <button
        className={btn(editorState.isUnderline)}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Souligné"
      >
        <Underline size={15} />
      </button>
      <button
        className={btn(editorState.isStrike)}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Barré"
      >
        <Strikethrough size={15} />
      </button>

      <div className="toolbar-divider" />

      {/* Lists */}
      <button
        className={btn(editorState.isBulletList)}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Liste à puces"
      >
        <List size={15} />
      </button>

      <div className="toolbar-divider" />

      {/* Alignment */}
      <button
        className={btn(editorState.isAlignLeft)}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        title="Aligner à gauche"
      >
        <AlignLeft size={15} />
      </button>
      <button
        className={btn(editorState.isAlignCenter)}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        title="Centrer"
      >
        <AlignCenter size={15} />
      </button>
      <button
        className={btn(editorState.isAlignRight)}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        title="Aligner à droite"
      >
        <AlignRight size={15} />
      </button>

    </div>
  )
}
