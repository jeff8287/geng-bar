import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { guestLogin, adminLogin } from '../api/auth'

type Mode = 'select' | 'guest' | 'admin'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [mode, setMode] = useState<Mode>('select')
  const [nickname, setNickname] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGuestLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await guestLogin(nickname.trim())
      login(res.access_token, res.user)
      navigate('/menu')
    } catch {
      setError('Could not login. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await adminLogin(username.trim(), password.trim())
      login(res.access_token, res.user)
      navigate('/admin')
    } catch (err: unknown) {
      console.error('Admin login error:', err)
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(`Login failed: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bar-bg flex flex-col items-center justify-center px-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #d4a76a 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-5 blur-3xl"
          style={{ background: 'radial-gradient(circle, #d4a76a 0%, transparent 70%)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, type: 'spring', stiffness: 150 }}
            className="text-6xl mb-4"
          >
            🍸
          </motion.div>
          <h1
            className="text-5xl font-display font-bold text-bar-gold text-shadow-gold tracking-wide mb-2"
          >
            庚 Bar
          </h1>
          <p className="text-gray-400 text-sm tracking-widest uppercase">Home Cocktail Bar</p>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <p className="text-center text-gray-400 mb-6 text-sm">Welcome! How would you like to continue?</p>
              <button
                onClick={() => setMode('guest')}
                className="w-full btn-gold py-4 text-lg rounded-xl flex items-center justify-center gap-3"
              >
                <span>🎉</span>
                <span>Guest — Browse Menu</span>
              </button>
              <button
                onClick={() => setMode('admin')}
                className="w-full btn-outline py-4 text-lg rounded-xl flex items-center justify-center gap-3"
              >
                <span>🔑</span>
                <span>Admin — Manage Bar</span>
              </button>
            </motion.div>
          )}

          {mode === 'guest' && (
            <motion.div
              key="guest"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <form onSubmit={handleGuestLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Your nickname</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="e.g. Alex, Party Queen..."
                    className="input-field text-lg"
                    autoFocus
                    maxLength={30}
                  />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={!nickname.trim() || loading}
                  className="w-full btn-gold py-4 text-lg rounded-xl"
                >
                  {loading ? 'Entering...' : 'Enter the Bar'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('select'); setError('') }}
                  className="w-full btn-ghost py-2 text-sm"
                >
                  ← Back
                </button>
              </form>
            </motion.div>
          )}

          {mode === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="input-field"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field"
                  />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={!username.trim() || !password.trim() || loading}
                  className="w-full btn-gold py-4 text-lg rounded-xl"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('select'); setError('') }}
                  className="w-full btn-ghost py-2 text-sm"
                >
                  ← Back
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <p className="absolute bottom-6 text-gray-600 text-xs">
        Drink responsibly. Enjoy the night. 🌙
      </p>
    </div>
  )
}
