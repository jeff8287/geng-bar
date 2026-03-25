import { useState } from 'react'
import { motion } from 'framer-motion'
import Header from '../components/layout/Header'
import MobileNav from '../components/layout/MobileNav'
import InventoryTable from '../components/admin/InventoryTable'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { useIngredients, useCreateIngredient, useUpdateIngredient } from '../hooks/useIngredients'

interface CreateIngredientPayload {
  name: string
  category: string
  subcategory?: string
  status: 'in_stock' | 'low' | 'out_of_stock'
}

const CATEGORIES = ['all', 'Spirits', 'Liqueurs', 'Juices', 'Bitters', 'Herbs', 'Fruits', 'Syrups', 'Other']

const EMPTY_FORM: CreateIngredientPayload = {
  name: '',
  category: 'Spirits',
  subcategory: '',
  status: 'in_stock',
}

export default function AdminInventory() {
  const { data: ingredients = [], isLoading: loading, dataUpdatedAt } = useIngredients({ refetchInterval: 30_000 })
  const createMutation = useCreateIngredient()
  const updateMutation = useUpdateIngredient()
  const [filterCategory, setFilterCategory] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CreateIngredientPayload>(EMPTY_FORM)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const saving = createMutation.isPending || updateMutation.isPending

  function openAddForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
    setError('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setError('')
    try {
      if (editingId !== null) {
        await updateMutation.mutateAsync({ id: editingId, payload: form })
      } else {
        await createMutation.mutateAsync(form)
      }
      setShowForm(false)
    } catch {
      setError('Could not save ingredient.')
    }
  }

  const displayed = ingredients.filter((i) => {
    const matchCat = filterCategory === 'all' || i.category === filterCategory
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="min-h-screen bg-bar-bg flex flex-col">
      <Header showBack backTo="/admin" title="Inventory" />
      <main className="flex-1 pb-24 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Toolbar */}
          <div className="p-4 flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ingredients..."
              className="input-field flex-1 py-2 text-sm"
            />
            <button onClick={openAddForm} className="btn-gold py-2 text-sm shrink-0">
              + Add
            </button>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                  filterCategory === cat
                    ? 'bg-bar-gold text-bar-bg'
                    : 'bg-bar-card text-gray-400 border border-bar-border hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Summary */}
          <div className="px-4 pb-2 flex items-center justify-between text-xs text-gray-500">
            <span>
              {displayed.length} ingredient{displayed.length !== 1 ? 's' : ''}
              {' '}· {displayed.filter((i) => i.status === 'in_stock').length} in stock
              {' '}· {displayed.filter((i) => i.status === 'low').length} low
              {' '}· {displayed.filter((i) => i.status === 'out_of_stock').length} out
            </span>
            {dataUpdatedAt > 0 && (
              <span className="text-gray-600">
                Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Table */}
          <div className="card mx-4">
            {loading ? (
              <div className="p-8 text-center text-gray-500 animate-pulse">Loading...</div>
            ) : (
              <InventoryTable
                ingredients={displayed}
              />
            )}
          </div>

          {/* Add/Edit Form Modal */}
          <Modal
            open={showForm}
            onClose={() => setShowForm(false)}
            title={editingId !== null ? 'Edit Ingredient' : 'Add Ingredient'}
          >
                <form onSubmit={handleSave} className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="input-field text-sm"
                      placeholder="e.g. Gin"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Category *</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="input-field text-sm"
                      >
                        {CATEGORIES.filter((c) => c !== 'all').map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Status</label>
                      <select
                        value={form.status}
                        onChange={(e) =>
                          setForm({ ...form, status: e.target.value as CreateIngredientPayload['status'] })
                        }
                        className="input-field text-sm"
                      >
                        <option value="in_stock">In Stock</option>
                        <option value="low">Low</option>
                        <option value="out_of_stock">Out of Stock</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Subcategory</label>
                    <input
                      type="text"
                      value={form.subcategory ?? ''}
                      onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                      className="input-field text-sm"
                      placeholder="e.g. London Dry"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Subcategory</label>
                    <input
                      type="text"
                      value={form.subcategory ?? ''}
                      onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                      className="input-field text-sm"
                      placeholder="e.g. Bourbon, Single Malt"
                    />
                  </div>
                  {error && <p className="text-red-400 text-xs">{error}</p>}
                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="flex-1 border border-bar-border">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving || !form.name.trim()} className="flex-1">
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </form>
          </Modal>
        </motion.div>
      </main>
      <MobileNav />
    </div>
  )
}
