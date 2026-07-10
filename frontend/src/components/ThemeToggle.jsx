import React from 'react'
import { FaMoon, FaSun } from 'react-icons/fa'
import useTheme from '../hooks/useTheme'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="theme-toggle-btn"
    >
      {isDark ? <FaSun className="theme-toggle-icon" aria-hidden /> : <FaMoon className="theme-toggle-icon" aria-hidden />}
    </button>
  )
}
