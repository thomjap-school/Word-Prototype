import { Server } from '@hocuspocus/server'
import { Database } from '@hocuspocus/extension-database'
import { TiptapTransformer } from '@hocuspocus/transformer'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import * as Y from 'yjs'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET
const PORT = 1234

// Doit rester aligné avec les extensions tiptap enregistrées côté client
// (Editor.tsx) : le schéma servant à (dé)sérialiser le contenu stocké est
// construit à partir de cette liste, pas de celle de l'éditeur.
TiptapTransformer.extensions([
  StarterKit,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  TextStyle,
  Color,
  FontFamily,
])

const server = Server.configure({
  port: PORT,
  extensions: [
    new Database({
      fetch: async ({ documentName }) => {
        try {
          const docId = parseInt(documentName.replace('document-', ''))
          const res = await fetch(`${BACKEND_URL}/documents/internal/${docId}`, {
            headers: { 'X-Internal-Secret': INTERNAL_SECRET },
          })
          if (!res.ok) return null
          const doc = await res.json()
          if (!doc.content) return null

          // Reconstruit un Y.Doc à partir du JSON Tiptap stocké,
          // puis retourne son état encodé pour Hocuspocus
          const ydoc = TiptapTransformer.toYdoc(doc.content, 'default')
          return Y.encodeStateAsUpdate(ydoc)
        } catch (err) {
          console.error('Database fetch error:', err)
          return null
        }
      },
      store: async ({ documentName, state }) => {
        try {
          const docId = parseInt(documentName.replace('document-', ''))
          const ydoc = new Y.Doc()
          Y.applyUpdate(ydoc, state)

          const content = TiptapTransformer.fromYdoc(ydoc, 'default')

          await fetch(`${BACKEND_URL}/documents/internal/${docId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Secret': INTERNAL_SECRET,
            },
            body: JSON.stringify({ content }),
          })
          console.log(`Document ${docId} saved via Yjs`)
        } catch (err) {
          console.error('Database store error:', err)
        }
      },
    }),
  ],
})

server.listen()
console.log(`HocusPocus server listening on ws://0.0.0.0:${PORT}`)
