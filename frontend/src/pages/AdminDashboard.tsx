import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import Header from '../components/layout/Header'
import MobileNav from '../components/layout/MobileNav'
import FilterModeToggle from '../components/admin/FilterModeToggle'
import { useMenu } from '../hooks/useMenu'
import { useIngredients } from '../hooks/useIngredients'
import { useAdminSettings, useUpdateFilterMode } from '../hooks/useAdminSettings'

const STOCK_COLORS = { in_stock: '#10b981', low: '#f59e0b', out_of_stock: '#ef4444' }
const STOCK_LABELS: Record<string, string> = { in_stock: 'In Stock', low: 'Low', out_of_stock: 'Out of Stock' }
const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#1a1a2e',
  border: '1px solid #2a2a4a',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '12px',
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { data: cocktails = [], isLoading: loadingCocktails } = useMenu()
  const { data: ingredients = [], isLoading: loadingIngredients } = useIngredients()
  const { data: settings } = useAdminSettings()
  const updateMode = useUpdateFilterMode()

  const loading = loadingCocktails || loadingIngredients

  const stats = {
    cocktails: cocktails.length,
    available: cocktails.filter((c) => c.is_available).length,
    ingredients: ingredients.length,
    inStock: ingredients.filter((i) => i.status === 'in_stock').length,
  }

  function handleModeChange(mode: 'strict' | 'flexible') {
    updateMode.mutate(mode)
  }

  const statCards = [
    { label: 'Total Cocktails', value: stats.cocktails, sub: `${stats.available} available`, icon: '🍸' },
    { label: 'Ingredients', value: stats.ingredients, sub: `${stats.inStock} in stock`, icon: '📦' },
  ]

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {}
    cocktails.forEach(c => {
      const cat = c.category || 'uncategorized'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return Object.entries(counts).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [cocktails])

  const stockData = useMemo(() => {
    const counts: Record<string, number> = { in_stock: 0, low: 0, out_of_stock: 0 }
    ingredients.forEach(i => { counts[i.status] = (counts[i.status] || 0) + 1 })
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([status, value]) => ({ name: STOCK_LABELS[status], value, status }))
  }, [ingredients])

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
              loading={updateMode.isPending}
            />
          )}

          {/* Charts */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Cocktails by Category</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                      <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: 'rgba(212,167,106,0.1)' }} />
                      <Bar dataKey="count" fill="#d4a76a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Ingredient Stock Status</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stockData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {stockData.map((entry) => (
                          <Cell key={entry.status} fill={STOCK_COLORS[entry.status as keyof typeof STOCK_COLORS]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
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
