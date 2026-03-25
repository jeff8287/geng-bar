import type { Ingredient } from '../../types'
import { updateIngredientStatus } from '../../api/ingredients'
import { useState } from 'react'

const STATUS_CONFIG = {
  in_stock: { label: 'In Stock', classes: 'bg-emerald-900/40 text-emerald-400 border-emerald-700' },
  low: { label: 'Low', classes: 'bg-amber-900/40 text-amber-400 border-amber-700' },
  out_of_stock: { label: 'Out of Stock', classes: 'bg-red-900/40 text-red-400 border-red-700' },
}

const STATUS_CYCLE: Record<string, 'in_stock' | 'low' | 'out_of_stock'> = {
  in_stock: 'low',
  low: 'out_of_stock',
  out_of_stock: 'in_stock',
}

interface InventoryTableProps {
  ingredients: Ingredient[]
  onUpdate: () => void
  filterCategory?: string
}

export default function InventoryTable({ ingredients, onUpdate, filterCategory }: InventoryTableProps) {
  const [updating, setUpdating] = useState<number | null>(null)

  const filtered = filterCategory && filterCategory !== 'all'
    ? ingredients.filter((i) => i.category === filterCategory)
    : ingredients

  async function handleStatusToggle(ingredient: Ingredient) {
    const nextStatus = STATUS_CYCLE[ingredient.status]
    setUpdating(ingredient.id)
    try {
      await updateIngredientStatus(ingredient.id, nextStatus)
      onUpdate()
    } catch {
      // silent fail
    } finally {
      setUpdating(null)
    }
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No ingredients found.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bar-border text-left">
            <th className="py-2 px-3 text-gray-400 font-medium">Name</th>
            <th className="py-2 px-3 text-gray-400 font-medium hidden sm:table-cell">Category</th>
            <th className="py-2 px-3 text-gray-400 font-medium hidden md:table-cell">Subcategory</th>
            <th className="py-2 px-3 text-gray-400 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-bar-border">
          {filtered.map((ingredient) => {
            const config = STATUS_CONFIG[ingredient.status]
            const isUpdating = updating === ingredient.id
            return (
              <tr key={ingredient.id} className="hover:bg-bar-card/50 transition-colors">
                <td className="py-3 px-3 text-white font-medium">{ingredient.name}</td>
                <td className="py-3 px-3 text-gray-400 hidden sm:table-cell capitalize">
                  {ingredient.category}
                </td>
                <td className="py-3 px-3 text-gray-500 hidden md:table-cell">
                  {ingredient.subcategory ?? '—'}
                </td>
                <td className="py-3 px-3">
                  <button
                    onClick={() => handleStatusToggle(ingredient)}
                    disabled={isUpdating}
                    className={`badge border cursor-pointer hover:opacity-80 transition-opacity ${config.classes} ${
                      isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="Click to cycle status"
                  >
                    {isUpdating ? '...' : config.label}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
