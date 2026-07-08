import { Server } from '@hocuspocus/server'
import { Database } from '@hocuspocus/extension-database'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'
const PORT = 1234

const server = Server.create({
  port: PORT,
  extensions: [
    new Database({
      fetch: async ({ documentName }) => {
        try {
          const docId = parseInt(documentName.replace('document-', ''))
          const res = await fetch(`${BACKEND_URL}/api/documents/${docId}`)
          const doc = await res.json()
          
          // Retourner le contenu Yjs si disponible (comme un Uint8Array)
          if (doc.content) {
            // HocusPocus attend un Uint8Array (état Yjs encoded)
            // Pour maintenant, on retourne un buffer vide et on laisse le client créer le doc
            return undefined
          }
          return undefined
        } catch (err) {
          console.error('Database fetch error:', err)
          return undefined
        }
      },
      store: async ({ documentName, state }) => {
        try {
          const docId = parseInt(documentName.replace('document-', ''))
          // Decoder l'état Yjs et sauvegarder le contenu
          const Y = require('yjs').default || require('yjs')
          const ydoc = new Y.Doc()
          Y.applyUpdate(ydoc, state)
          
          const yContent = ydoc.getMap('content')
          const content = yContent ? yContent.toJSON() : null
          
          await fetch(`${BACKEND_URL}/api/documents/${docId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
          })
          console.log(`Document ${docId} saved via Yjs`)
        } catch (err) {
          console.error('Database store error:', err)
        }
      }
    })
  ]
})

server.listen()
console.log(`HocusPocus server listening on ws://0.0.0.0:${PORT}`)
