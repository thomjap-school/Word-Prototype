import { Routes, Route } from 'react-router-dom'
import Home from './Home'
import EditorPage from './EditorPage'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'
import ProfilePage from './ProfilePage'
import JoinPage from './Joinpage'
import ProtectedRoute from './ProtectedRoute'
import ColorThemePicker from './Colorthemepicker'

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/editor/new" element={<EditorPage />} />
          <Route path="/editor/:id" element={<EditorPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/join/:token" element={<JoinPage />} />
        </Route>
      </Routes>
      <ColorThemePicker />
    </>
  )
}

export default App
