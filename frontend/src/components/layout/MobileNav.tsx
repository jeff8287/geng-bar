import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function MobileNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAdmin } = useAuth()

  const items = [
    { label: 'Menu', icon: '🍸', path: '/menu' },
    ...(isAdmin
      ? [
          { label: 'Inventory', icon: '📦', path: '/admin/inventory' },
          { label: 'Cocktails', icon: '✏️', path: '/admin/cocktails' },
          { label: 'Dashboard', icon: '📊', path: '/admin' },
        ]
      : []),
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bar-card border-t border-bar-border safe-area-pb">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const active = location.pathname === item.path ||
            (item.path !== '/menu' && location.pathname.startsWith(item.path))
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 py-3 px-4 transition-colors ${
                active ? 'text-bar-gold' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
