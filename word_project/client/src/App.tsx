import { Routes, Route } from 'react-router-dom'
import Home from './Home'
import EditorPage from './EditorPage'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'
import ProtectedRoute from './ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/editor/:id" element={<EditorPage />} />
      </Route>
    </Routes>
  )
}

export default App