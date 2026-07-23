import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import EditorPage from './pages/EditorPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ProfilePage from './pages/ProfilePage'
import JoinPage from './pages/JoinPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ColorThemePicker from './components/layout/ColorThemePicker'
import { MusicPlayerProvider } from './components/music/MusicPlayerContext'

function App() {
  return (
    <MusicPlayerProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/editor/:id" element={<EditorPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/join/:token" element={<JoinPage />} />
        </Route>
      </Routes>
      <ColorThemePicker />
    </MusicPlayerProvider>
  )
}

export default App