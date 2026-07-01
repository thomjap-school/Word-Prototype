import Editor from './Editor'
import { FileText } from 'lucide-react'

export default function EditorPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 h-14 flex items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
            <FileText size={14} className="text-white" />
          </div>
          <span className="text-sm font-medium text-gray-900">Word Prototype</span>
        </div>
      </header>

      {/* Editor */}
      <Editor />

    </div>
  )
}
