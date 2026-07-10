import './index.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Projects from './components/Projects'
import Intro from './components/Intro'
import Skills from './components/Skills'
import Contact from './components/Contact'
import Resume from './components/Resume'
import useTheme from './hooks/useTheme'
import Login from './pages/Login'
import { isAuthenticated, logout } from './utils/auth'
import { useState } from 'react'

function PortfolioHome({ isLoggedIn, onLogout }) {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors">
      <Header isLoggedIn={isLoggedIn} onLogout={onLogout} />
      <main className="page-content">
        <Intro isLoggedIn={isLoggedIn} />
        <Skills isLoggedIn={isLoggedIn} />
        <Projects isLoggedIn={isLoggedIn} />
        <Resume isLoggedIn={isLoggedIn} />
        <Contact />
      </main>
    </div>
  )
}

function App() {
  useTheme()
  const [isLoggedIn, setIsLoggedIn] = useState(() => isAuthenticated())

  const handleLogout = () => {
    logout()
    setIsLoggedIn(false)
  }

  return (
    <Routes>
      <Route path="/" element={<PortfolioHome isLoggedIn={isLoggedIn} onLogout={handleLogout} />} />
      <Route
        path="/login"
        element={
          isLoggedIn
            ? <Navigate to="/" replace />
            : <Login onLoginSuccess={() => setIsLoggedIn(true)} />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
