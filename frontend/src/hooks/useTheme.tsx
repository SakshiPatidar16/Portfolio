import { useState, useEffect } from 'react'

const THEME_KEY = 'theme'

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY)
      if (stored) return stored
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
    } catch (e) {}
    return 'light'
  })

  useEffect(() => {
    const apply = (t) => {
      const root = document.documentElement
      if (t === 'dark') root.classList.add('dark')
      else root.classList.remove('dark')
    }

    apply(theme)

    const onStorage = (e) => {
      if (e.key === THEME_KEY) {
        setThemeState(e.newValue || 'light')
      }
    }

    const onCustom = (e) => {
      if (e?.detail) setThemeState(e.detail)
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener('theme-change', onCustom)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('theme-change', onCustom)
    }
    // only run once on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setTheme = (t) => {
    try {
      localStorage.setItem(THEME_KEY, t)
    } catch (e) {}
    const root = document.documentElement
    if (t === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    window.dispatchEvent(new CustomEvent('theme-change', { detail: t }))
    setThemeState(t)
  }

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return { theme, setTheme, toggle }
}

export default useTheme
