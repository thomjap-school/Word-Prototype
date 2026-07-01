import { useNavigate } from 'react-router-dom'
import { Search, FileText, Plus, Clock, ArrowRight, FileCheck, ClipboardList, AlignLeft } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()

  const documents = [
    { id: 1, title: 'Rapport de projet', updated: "Aujourd'hui à 10:45", isRecent: true },
    { id: 2, title: 'Compte rendu réunion', updated: 'Hier à 17:20', isRecent: false },
    { id: 3, title: 'Notes personnelles', updated: '22 juin 2026', isRecent: false },
  ]

  const templates = [
    { label: 'Document vide', icon: Plus, featured: true },
    { label: 'Rapport', icon: FileCheck, featured: false },
    { label: 'Compte rendu', icon: ClipboardList, featured: false },
    { label: 'Mémo', icon: AlignLeft, featured: false },
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 h-14 flex items-center justify-between sticky top-0 z-10">

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
            <FileText size={14} className="text-white" />
          </div>
          <span className="text-sm font-medium text-gray-900">Word Prototype</span>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-3 h-9 w-72">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Rechercher un document..."
            className="bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400 w-full"
          />
        </div>

        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-medium text-blue-600 cursor-pointer">
          EM
        </div>

      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-6 py-8">

        {/* Nouveau document */}
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">
          Nouveau document
        </p>

        <div className="grid grid-cols-4 gap-3 mb-8">
          {templates.map(({ label, icon: Icon, featured }) => (
            <div
              key={label}
              onClick={() => navigate('/editor')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition
                ${featured
                  ? 'border-blue-300 bg-white hover:bg-blue-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
            >
              <Icon size={22} className={featured ? 'text-blue-500' : 'text-gray-400'} />
              <span className="text-xs font-medium text-gray-600 text-center">{label}</span>
            </div>
          ))}
        </div>

        <hr className="border-gray-200 mb-8" />

        {/* Documents récents */}
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
          Documents récents
        </p>

        <div className="flex flex-col gap-0.5">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => navigate('/editor')}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-white hover:shadow-sm transition"
            >

              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <FileText size={17} className="text-blue-500" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                  <Clock size={11} />
                  {doc.updated}
                </div>
              </div>

              {doc.isRecent && (
                <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  Récent
                </span>
              )}

              <div className="flex items-center gap-1 text-xs font-medium text-blue-500 opacity-0 group-hover:opacity-100 transition">
                <ArrowRight size={13} />
                Ouvrir
              </div>

            </div>
          ))}
        </div>

      </main>

    </div>
  )
}
