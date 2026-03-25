import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import LoginPage from './pages/LoginPage'
import MenuPage from './pages/MenuPage'
import CocktailDetailPage from './pages/CocktailDetailPage'

const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'))
const AdminInventory = React.lazy(() => import('./pages/AdminInventory'))
const AdminCocktails = React.lazy(() => import('./pages/AdminCocktails'))

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-bar-bg flex items-center justify-center">
      <div className="text-bar-gold text-4xl animate-pulse">🍸</div>
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  // Also check localStorage directly so a page refresh doesn't evict the user
  // before the context re-hydrates from localStorage on mount.
  const hasStoredToken = !!localStorage.getItem('token') && !!localStorage.getItem('user')
  if (!isAuthenticated && !hasStoredToken) return <Navigate to="/" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth()
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (!isAdmin) return <Navigate to="/menu" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/menu"
        element={
          <RequireAuth>
            <MenuPage />
          </RequireAuth>
        }
      />
      <Route
        path="/menu/:id"
        element={
          <RequireAuth>
            <CocktailDetailPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <Suspense fallback={<LoadingSpinner />}>
              <AdminDashboard />
            </Suspense>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/inventory"
        element={
          <RequireAdmin>
            <Suspense fallback={<LoadingSpinner />}>
              <AdminInventory />
            </Suspense>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/cocktails"
        element={
          <RequireAdmin>
            <Suspense fallback={<LoadingSpinner />}>
              <AdminCocktails />
            </Suspense>
          </RequireAdmin>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
      <AuthProvider>
        <FavoritesProvider>
        <AppRoutes />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid #2a2a4a',
              fontSize: '14px',
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
          }}
        />
      </FavoritesProvider>
      </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
