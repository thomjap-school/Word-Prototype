import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      
      <h1 className="text-3xl font-bold">
        Word Prototype
      </h1>

      <button
        onClick={() => navigate('/editor')}
        className="px-4 py-2 bg-black text-white rounded"
      >
        New Document
      </button>

    </div>
  )
}
