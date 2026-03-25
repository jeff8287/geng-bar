import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../components/layout/Header'
import MobileNav from '../components/layout/MobileNav'
import AvailabilityBadge from '../components/menu/AvailabilityBadge'
import { useMenu } from '../hooks/useMenu'
import { useIngredients } from '../hooks/useIngredients'
import { useCreateCocktail, useUpdateCocktail, useDeleteCocktail } from '../hooks/useCocktailAdmin'

interface CreateCocktailPayload {
  name: string
  category: string
  description?: string
  instructions?: string
  garnish?: string
  glass_type?: string
  ingredients: IngredientEntry[]
}

const CATEGORIES = ['refreshing', 'sweet', 'complex', 'tropical', 'seasonal', 'shots']

type IngredientEntry = {
  ingredient_id: number
  amount: string
  unit: string
  optional: boolean
}

const EMPTY_FORM: Omit<CreateCocktailPayload, 'ingredients'> = {
  name: '',
  category: 'refreshing',
  description: '',
  instructions: '',
  garnish: '',
  glass_type: '',
}

export default function AdminCocktails() {
  const navigate = useNavigate()
  const { data: cocktails = [], isLoading: loading } = useMenu()
  const { data: allIngredients = [] } = useIngredients()
  const createMutation = useCreateCocktail()
  const updateMutation = useUpdateCocktail()
  const deleteMutation = useDeleteCocktail()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<Omit<CreateCocktailPayload, 'ingredients'>>(EMPTY_FORM)
  const [ingredientEntries, setIngredientEntries] = useState<IngredientEntry[]>([])
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const saving = createMutation.isPending || updateMutation.isPending

  function openAddForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setIngredientEntries([])
    setShowForm(true)
    setError('')
  }

  function addIngredientEntry() {
    if (allIngredients.length === 0) return
    setIngredientEntries([...ingredientEntries, {
      ingredient_id: allIngredients[0].id,
      amount: '1',
      unit: 'oz',
      optional: false,
    }])
  }

  function updateEntry(index: number, patch: Partial<IngredientEntry>) {
    setIngredientEntries(ingredientEntries.map((e, i) => i === index ? { ...e, ...patch } : e))
  }

  function removeEntry(index: number) {
    setIngredientEntries(ingredientEntries.filter((_, i) => i !== index))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setError('')
    try {
      const payload: CreateCocktailPayload = { ...form, ingredients: ingredientEntries }
      if (editingId !== null) {
        await updateMutation.mutateAsync({ id: editingId, payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      setShowForm(false)
    } catch {
      setError('Could not save cocktail.')
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteMutation.mutateAsync(id)
      setDeleteConfirm(null)
    } catch {
      setError('Could not delete cocktail.')
    }
  }

  const displayed = cocktails.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-bar-bg flex flex-col">
      <Header showBack backTo="/admin" title="Cocktails" />
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
              placeholder="Search cocktails..."
              className="input-field flex-1 py-2 text-sm"
            />
            <button onClick={openAddForm} className="btn-gold py-2 text-sm shrink-0">
              + Add
            </button>
          </div>

          <div className="px-4 pb-2 text-xs text-gray-500">
            {displayed.length} cocktail{displayed.length !== 1 ? 's' : ''}
            {' '}· {displayed.filter((c) => c.is_available).length} available
          </div>

          {/* Cocktail list */}
          <div className="px-4 space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="h-4 bg-bar-border rounded w-2/3 mb-2" />
                  <div className="h-3 bg-bar-border rounded w-1/3" />
                </div>
              ))
            ) : displayed.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No cocktails found.</div>
            ) : (
              displayed.map((cocktail) => (
                <div
                  key={cocktail.id}
                  className="card p-4 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-white font-medium text-sm cursor-pointer hover:text-bar-gold transition-colors truncate"
                        onClick={() => navigate(`/menu/${cocktail.id}`)}
                      >
                        {cocktail.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge bg-bar-bg text-gray-400 capitalize text-xs">
                        {cocktail.category}
                      </span>
                      <AvailabilityBadge available={cocktail.is_available} size="sm" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => navigate(`/menu/${cocktail.id}`)}
                      className="text-gray-500 hover:text-bar-gold transition-colors text-sm p-1"
                      title="View"
                    >
                      👁
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(cocktail.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors text-sm p-1"
                      title="Delete"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Delete confirm dialog */}
          {deleteConfirm !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
              <div className="absolute inset-0 bg-black/70" onClick={() => setDeleteConfirm(null)} />
              <div className="relative card p-6 max-w-sm w-full z-10">
                <h3 className="font-semibold text-white mb-2">Delete cocktail?</h3>
                <p className="text-gray-400 text-sm mb-4">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn-ghost border border-bar-border">
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add/Edit Form Modal */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-y-auto">
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setShowForm(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative w-full max-w-lg bg-bar-card border border-bar-border rounded-t-2xl sm:rounded-2xl p-6 z-10 my-auto mx-4 max-h-[90vh] overflow-y-auto"
              >
                <h3 className="font-semibold text-white mb-4">
                  {editingId !== null ? 'Edit Cocktail' : 'Add Cocktail'}
                </h3>
                <form onSubmit={handleSave} className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="input-field text-sm"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="input-field text-sm"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Glass Type</label>
                      <input
                        type="text"
                        value={form.glass_type ?? ''}
                        onChange={(e) => setForm({ ...form, glass_type: e.target.value })}
                        className="input-field text-sm"
                        placeholder="Rocks, Coupe, etc."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Description</label>
                    <textarea
                      value={form.description ?? ''}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="input-field text-sm resize-none"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Instructions *</label>
                    <textarea
                      value={form.instructions}
                      onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                      className="input-field text-sm resize-none"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Garnish</label>
                      <input
                        type="text"
                        value={form.garnish ?? ''}
                        onChange={(e) => setForm({ ...form, garnish: e.target.value })}
                        className="input-field text-sm"
                        placeholder="Lime wedge"
                      />
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-gray-400">Ingredients</label>
                      <button
                        type="button"
                        onClick={addIngredientEntry}
                        className="text-xs text-bar-gold hover:text-bar-gold-light"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {ingredientEntries.map((entry, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <select
                            value={entry.ingredient_id}
                            onChange={(e) => updateEntry(i, { ingredient_id: Number(e.target.value) })}
                            className="input-field text-xs flex-1 py-1.5"
                          >
                            {allIngredients.map((ing) => (
                              <option key={ing.id} value={ing.id}>{ing.name}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={entry.amount}
                            onChange={(e) => updateEntry(i, { amount: e.target.value })}
                            placeholder="1"
                            className="input-field text-xs w-14 py-1.5"
                          />
                          <input
                            type="text"
                            value={entry.unit}
                            onChange={(e) => updateEntry(i, { unit: e.target.value })}
                            placeholder="oz"
                            className="input-field text-xs w-14 py-1.5"
                          />
                          <button
                            type="button"
                            onClick={() => removeEntry(i)}
                            className="text-gray-600 hover:text-red-400 text-sm shrink-0"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {ingredientEntries.length === 0 && (
                        <p className="text-gray-600 text-xs text-center py-2">
                          No ingredients added yet
                        </p>
                      )}
                    </div>
                  </div>

                  {error && <p className="text-red-400 text-xs">{error}</p>}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 btn-ghost border border-bar-border"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !form.name.trim()}
                      className="flex-1 btn-gold"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </motion.div>
      </main>
      <MobileNav />
    </div>
  )
}
