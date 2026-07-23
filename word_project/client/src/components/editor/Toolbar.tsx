import { useState } from 'react'
import { Editor, useEditorState } from '@tiptap/react'
import {
  Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2,
  Strikethrough, AlignLeft, AlignCenter, AlignRight, Undo, Redo, Palette,
  Highlighter, Link as LinkIcon, Quote, Minus, Eraser
} from 'lucide-react'
import { useClickOutside } from '../../hooks/useClickOutside'

type Props = {
  editor: Editor | null
}

const PRESET_COLORS = [
  { label: 'Noir', value: '#111827' },
  { label: 'Gris', value: '#6b7280' },
  { label: 'Rouge', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Jaune', value: '#eab308' },
  { label: 'Vert', value: '#22c55e' },
  { label: 'Bleu', value: '#3b82f6' },
  { label: 'Violet', value: '#a855f7' },
]

const FONTS = [
  { label: 'Par défaut', value: '' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS' },
  { label: 'Tahoma', value: 'Tahoma' },
  { label: 'Segoe UI', value: 'Segoe UI' },
  { label: 'Calibri', value: 'Calibri' },
  { label: 'Garamond', value: 'Garamond' },
  { label: 'Palatino', value: 'Palatino Linotype' },
  { label: 'Century Gothic', value: 'Century Gothic' },
  { label: 'Lucida Console', value: 'Lucida Console' },
  { label: 'Impact', value: 'Impact' },
  { label: 'Comic Sans MS', value: 'Comic Sans MS' },
  { label: 'Brush Script', value: 'Brush Script MT' },
  { label: 'Papyrus', value: 'Papyrus' },
]

export default function Toolbar({ editor }: Props) {
  const [colorOpen, setColorOpen] = useState(false)
  const colorRef = useClickOutside<HTMLDivElement>(() => setColorOpen(false))

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
        isOrderedList: ctx.editor.isActive('orderedList'),
        isBlockquote: ctx.editor.isActive('blockquote'),
        isHighlight: ctx.editor.isActive('highlight'),
        isLink: ctx.editor.isActive('link'),
        isAlignLeft: ctx.editor.isActive({ textAlign: 'left' }),
        isAlignCenter: ctx.editor.isActive({ textAlign: 'center' }),
        isAlignRight: ctx.editor.isActive({ textAlign: 'right' }),
        color: ctx.editor.getAttributes('textStyle').color as string | undefined,
        words: ctx.editor.storage.characterCount?.words() ?? 0,
        characters: ctx.editor.storage.characterCount?.characters() ?? 0,
      }
    },
  })

  if (!editor || !editorState) return null

  const btn = (active: boolean) =>
    `toolbar-btn ${active ? 'toolbar-btn--active' : ''}`

  const setColor = (value: string) => {
    editor.chain().focus().setColor(value).run()
    setColorOpen(false)
  }

  const resetColor = () => {
    editor.chain().focus().unsetColor().run()
    setColorOpen(false)
  }

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const font = e.target.value
    if (font) {
      editor.chain().focus().setFontFamily(font).run()
    } else {
      editor.chain().focus().unsetFontFamily().run()
    }
  }

  const handleLinkToggle = () => {
    if (editorState.isLink) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    const url = window.prompt('Adresse du lien (https://...)')
    if (!url) return
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const handleClearFormatting = () => {
    editor.chain().focus().clearNodes().unsetAllMarks().run()
  }

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

      {/* Police */}
      <select
        className="toolbar-font-select"
        value={editor.getAttributes('textStyle').fontFamily || ''}
        onChange={handleFontChange}
        title="Police"
      >
        {FONTS.map((font) => (
          <option key={font.label} value={font.value} style={{ fontFamily: font.value || 'inherit' }}>
            {font.label}
          </option>
        ))}
      </select>

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
      <button
        className={btn(editorState.isBlockquote)}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Citation"
      >
        <Quote size={15} />
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
      <button
        className={btn(editorState.isHighlight)}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        title="Surligner"
      >
        <Highlighter size={15} />
      </button>
      <button
        className={btn(editorState.isLink)}
        onClick={handleLinkToggle}
        title="Lien"
      >
        <LinkIcon size={15} />
      </button>

      {/* Color picker */}
      <div className="toolbar-color-wrap" ref={colorRef}>
        <button
          className={btn(!!editorState.color)}
          onClick={() => setColorOpen((v) => !v)}
          title="Couleur du texte"
        >
          <Palette size={15} style={editorState.color ? { color: editorState.color } : undefined} />
        </button>

        {colorOpen && (
          <div className="color-popover">
            <div className="color-grid">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`color-swatch ${editorState.color === c.value ? 'color-swatch--active' : ''}`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                  onClick={() => setColor(c.value)}
                />
              ))}
            </div>
            <div className="color-popover-footer">
              <label className="color-custom-label">
                <input
                  type="color"
                  className="color-custom-input"
                  value={editorState.color || '#111827'}
                  onChange={(e) => setColor(e.target.value)}
                  title="Couleur personnalisée"
                />
                Personnalisée
              </label>
              <button type="button" className="color-reset-btn" onClick={resetColor}>
                Réinitialiser
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="toolbar-divider" />

      {/* Lists */}
      <button
        className={btn(editorState.isBulletList)}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Liste à puces"
      >
        <List size={15} />
      </button>
      <button
        className={btn(editorState.isOrderedList)}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Liste numérotée"
      >
        <ListOrdered size={15} />
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

      <div className="toolbar-divider" />

      {/* Insert / cleanup */}
      <button
        className={btn(false)}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Ligne horizontale"
      >
        <Minus size={15} />
      </button>
      <button
        className={btn(false)}
        onClick={handleClearFormatting}
        title="Effacer la mise en forme"
      >
        <Eraser size={15} />
      </button>

      <div className="toolbar-spacer" />

      {/* Word count */}
      <span className="toolbar-wordcount">
        {editorState.words} mots · {editorState.characters} car.
      </span>

    </div>
  )
}
