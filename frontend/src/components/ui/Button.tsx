import type { ButtonHTMLAttributes } from 'react'

type Variant = 'gold' | 'outline' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
}

const variantClasses: Record<Variant, string> = {
  gold: 'bg-bar-gold text-bar-bg font-semibold hover:bg-bar-gold-light active:bg-bar-gold-dark disabled:opacity-50 disabled:cursor-not-allowed',
  outline: 'border border-bar-gold text-bar-gold font-semibold hover:bg-bar-gold hover:text-bar-bg active:bg-bar-gold-dark disabled:opacity-50 disabled:cursor-not-allowed',
  ghost: 'text-gray-400 font-medium hover:text-white hover:bg-bar-card dark:hover:bg-gray-700',
  danger: 'bg-red-600 hover:bg-red-500 text-white font-semibold',
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 rounded-lg',
  lg: 'px-6 py-4 text-lg rounded-xl',
}

export default function Button({ variant = 'gold', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`transition-colors duration-200 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
