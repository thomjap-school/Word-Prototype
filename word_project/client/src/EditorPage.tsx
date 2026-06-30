import Editor from './Editor'

export default function EditorPage() {

  const handleSave = () => {
    console.log("Save clicked")
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b">
        <div className="font-bold">Word Prototype</div>

        <input
          className="text-gray-600 border-none outline-none bg-transparent text-center"
          placeholder="Document sans titre"
        />

        <button
          onClick={handleSave}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          Save
        </button>
      </div>

      {/* EDITOR */}
      <Editor />

    </div>
  )
}
