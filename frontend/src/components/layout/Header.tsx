import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

interface HeaderProps {
  showBack?: boolean
  backTo?: string
  title?: string
}

export default function Header({ showBack, backTo = '/menu', title }: HeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { t, i18n } = useTranslation()
  const { theme, toggle: toggleTheme } = useTheme()

  function handleLogout() {
    logout()
    navigate('/')
  }

  function toggleLang() {
    const next = i18n.language === 'ko' ? 'en' : 'ko'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  return (
    <header className="sticky top-0 z-50 bg-bar-bg border-b border-bar-border">
      <div className="flex items-center justify-between px-4 h-14 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 min-w-0">
          {showBack ? (
            <button
              onClick={() => navigate(backTo)}
              className="text-bar-gold hover:text-bar-gold-light transition-colors p-1 -ml-1 shrink-0"
              aria-label="Go back"
            >
              ←
            </button>
          ) : null}
          <span
            className="text-bar-gold font-display font-bold text-xl cursor-pointer shrink-0"
            onClick={() => navigate('/menu')}
          >
            庚 Bar
          </span>
          {title && (
            <span className="text-gray-400 text-sm truncate">/ {title}</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {user && (
            <span className="text-gray-400 text-sm hidden sm:block truncate max-w-24">
              {user.nickname ?? user.username}
            </span>
          )}
          <button
            onClick={toggleTheme}
            className="text-gray-500 hover:text-bar-gold transition-colors text-xs px-2 py-1 rounded border border-bar-border"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
          <button
            onClick={toggleLang}
            className="text-gray-500 hover:text-bar-gold transition-colors text-xs px-2 py-1 rounded border border-bar-border"
          >
            {i18n.language === 'ko' ? 'EN' : '한'}
          </button>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-400 transition-colors text-sm px-2 py-1 rounded"
          >
            {t('nav.exit')}
          </button>
        </div>
      </div>
    </header>
  )
}
