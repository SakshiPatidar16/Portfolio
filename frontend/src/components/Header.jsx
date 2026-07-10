import React, { useEffect, useState } from 'react'
import ThemeToggle from './ThemeToggle'

const LINKS = [
  { href: '#intro', label: 'Home' },
  { href: '#projects', label: 'Portfolio' },
  { href: '#skills', label: 'About' },
  { href: '#contact', label: 'Contact' },
]

export default function Header({ isLoggedIn, onLogout }) {
  const [active, setActive] = useState(() => window.location.hash || '#intro')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onHash = () => {
      setActive(window.location.hash || '#intro')
      setMenuOpen(false)
    }

    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <header className="site-header">
      <div className="container header-shell">
        <div className="brand">Sakshi Patidar</div>

        <button
          type="button"
          className={`header-menu-btn ${menuOpen ? 'open' : ''}`}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`header-nav ${menuOpen ? 'open' : ''}`}>
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`nav-link ${active === l.href ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </a>
          ))}

          {isLoggedIn ? (
            <button
              type="button"
              className="nav-link"
              onClick={() => {
                onLogout()
                setMenuOpen(false)
              }}
            >
              Logout
            </button>
          ) : null}


          <div className="theme-toggle-wrap">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  )
}
