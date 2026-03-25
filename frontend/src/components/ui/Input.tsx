import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export default function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div>
      {label && <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</label>}
      <input
        className={`w-full bg-bar-bg dark:bg-gray-900 border border-bar-border dark:border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-bar-gold transition-colors duration-200 ${className}`}
        {...props}
      />
    </div>
  )
}
