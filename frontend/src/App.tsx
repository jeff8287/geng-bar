import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import MenuPage from './pages/MenuPage'
import CocktailDetailPage from './pages/CocktailDetailPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminInventory from './pages/AdminInventory'
import AdminCocktails from './pages/AdminCocktails'

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
            <AdminDashboard />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/inventory"
        element={
          <RequireAdmin>
            <AdminInventory />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/cocktails"
        element={
          <RequireAdmin>
            <AdminCocktails />
          </RequireAdmin>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
