import { Routes, Route } from 'react-router-dom'
import Home from './Home'
import EditorPage from './EditorPage'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'
import VerifyEmailPage from './VerifyEmailPage'
import ProfilePage from './ProfilePage'
import JoinPage from './Joinpage'
import ProtectedRoute from './ProtectedRoute'
import ColorThemePicker from './Colorthemepicker'
import { MusicPlayerProvider } from './MusicPlayerContext'

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