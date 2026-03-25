interface FilterModeToggleProps {
  mode: 'strict' | 'flexible'
  onChange: (mode: 'strict' | 'flexible') => void
  loading?: boolean
}

export default function FilterModeToggle({ mode, onChange, loading }: FilterModeToggleProps) {
  const isStrict = mode === 'strict'

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white text-sm">Availability Filter Mode</h3>
          <p className="text-gray-500 text-xs mt-0.5">
            {isStrict
              ? 'Strict: All ingredients must be in stock'
              : 'Flexible: Show cocktails with low-stock ingredients'}
          </p>
        </div>
        <button
          disabled={loading}
          onClick={() => onChange(isStrict ? 'flexible' : 'strict')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isStrict ? 'bg-bar-gold' : 'bg-bar-border'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          role="switch"
          aria-checked={isStrict}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              isStrict ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      <div className="flex gap-2">
        <span
          className={`badge ${
            isStrict
              ? 'bg-amber-900/40 text-amber-400'
              : 'bg-blue-900/40 text-blue-400'
          }`}
        >
          {isStrict ? '🔒 Strict Mode' : '🔓 Flexible Mode'}
        </span>
      </div>
    </div>
  )
}
