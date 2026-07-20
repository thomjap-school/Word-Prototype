import Editor from './Editor'
import MusicPlayer from './MusicPlayer'
import { FileText } from 'lucide-react'

export default function EditorPage() {
  return (
    <div className="page-shell">

      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">
            <FileText size={14} className="text-white" />
          </div>
          <span className="app-logo-text">Word Prototype</span>
        </div>

        <div className="app-header-center">
          <MusicPlayer />
        </div>
      </header>

      {/* Editor */}
      <Editor />

    </div>
  )
}
