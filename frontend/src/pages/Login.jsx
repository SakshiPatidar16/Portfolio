import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../utils/auth'

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!login(username.trim(), password)) {
      setError('Invalid credentials. Please try again.')
      return
    }

    onLoginSuccess()
    navigate('/', { replace: true })
  }

  return (
    <section className="section-block login-page">
      <div className="container">
        <div className="login-card">
          <h2 className="section-heading">Admin Login</h2>
          <p className="login-help">Sign in to manage projects (add/remove) on your portfolio.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-label" htmlFor="username">Username</label>
            <input
              id="username"
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />

            <label className="login-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            {error ? <p className="login-error">{error}</p> : null}

            <div className="login-actions">
              <button type="submit" className="btn">Login</button>
              <button type="button" className="btn-outline" onClick={() => navigate('/', { replace: true })}>Back to Home</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
