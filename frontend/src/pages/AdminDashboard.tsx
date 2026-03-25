import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../components/layout/Header'
import MobileNav from '../components/layout/MobileNav'
import FilterModeToggle from '../components/admin/FilterModeToggle'
import { getMenu } from '../api/cocktails'
import { getIngredients } from '../api/ingredients'
import client from '../api/client'
import type { AppSettings } from '../types'

interface Stats {
  cocktails: number
  available: number
  ingredients: number
  inStock: number
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ cocktails: 0, available: 0, ingredients: 0, inStock: 0 })
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingMode, setSavingMode] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [cocktails, ingredients, settingsRes] = await Promise.allSettled([
          getMenu(),
          getIngredients(),
          client.get<AppSettings>('/admin/settings'),
        ])
        if (cocktails.status === 'fulfilled') {
          setStats((s) => ({
            ...s,
            cocktails: cocktails.value.length,
            available: cocktails.value.filter((c) => c.is_available).length,
          }))
        }
        if (ingredients.status === 'fulfilled') {
          setStats((s) => ({
            ...s,
            ingredients: ingredients.value.length,
            inStock: ingredients.value.filter((i) => i.status === 'in_stock').length,
          }))
        }
        if (settingsRes.status === 'fulfilled') {
          setSettings(settingsRes.value.data)
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  async function handleModeChange(mode: 'strict' | 'flexible') {
    setSavingMode(true)
    try {
      const res = await client.patch<AppSettings>('/admin/settings', { filter_mode: mode })
      setSettings(res.data)
    } catch {
      // silent
    } finally {
      setSavingMode(false)
    }
  }

  const statCards = [
    { label: 'Total Cocktails', value: stats.cocktails, sub: `${stats.available} available`, icon: '🍸' },
    { label: 'Ingredients', value: stats.ingredients, sub: `${stats.inStock} in stock`, icon: '📦' },
  ]

  return (
    <div className="min-h-screen bg-bar-bg flex flex-col">
      <Header title="Admin" />
      <main className="flex-1 pb-24 p-4 max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
            <p className="text-gray-500 text-sm">Welcome back, Admin</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="card p-4"
              >
                <div className="text-2xl mb-2">{card.icon}</div>
                {loading ? (
                  <div className="h-8 bg-bar-border rounded animate-pulse mb-1" />
                ) : (
                  <div className="text-3xl font-bold text-white mb-1">{card.value}</div>
                )}
                <div className="text-gray-500 text-xs">{card.label}</div>
                <div className="text-gray-600 text-xs mt-0.5">{card.sub}</div>
              </motion.div>
            ))}
          </div>

          {/* Filter mode toggle */}
          {settings && (
            <FilterModeToggle
              mode={settings.filter_mode}
              onChange={handleModeChange}
              loading={savingMode}
            />
          )}

          {/* Quick actions */}
          <div>
            <h2 className="section-title">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/admin/inventory')}
                className="w-full card p-4 flex items-center gap-4 hover:border-bar-gold/40 transition-colors text-left"
              >
                <span className="text-2xl">📦</span>
                <div>
                  <p className="font-medium text-white">Manage Inventory</p>
                  <p className="text-gray-500 text-xs">Update ingredient stock levels</p>
                </div>
                <span className="text-gray-600 ml-auto">→</span>
              </button>
              <button
                onClick={() => navigate('/admin/cocktails')}
                className="w-full card p-4 flex items-center gap-4 hover:border-bar-gold/40 transition-colors text-left"
              >
                <span className="text-2xl">✏️</span>
                <div>
                  <p className="font-medium text-white">Manage Cocktails</p>
                  <p className="text-gray-500 text-xs">Add, edit, or remove cocktails</p>
                </div>
                <span className="text-gray-600 ml-auto">→</span>
              </button>
              <button
                onClick={() => navigate('/menu')}
                className="w-full card p-4 flex items-center gap-4 hover:border-bar-gold/40 transition-colors text-left"
              >
                <span className="text-2xl">🍸</span>
                <div>
                  <p className="font-medium text-white">View Guest Menu</p>
                  <p className="text-gray-500 text-xs">See what guests see</p>
                </div>
                <span className="text-gray-600 ml-auto">→</span>
              </button>
            </div>
          </div>
        </motion.div>
      </main>
      <MobileNav />
    </div>
  )
}
