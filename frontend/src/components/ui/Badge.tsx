import type { HTMLAttributes } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-bar-card border border-bar-border text-gray-400',
  success: 'bg-emerald-900/40 text-emerald-400 border border-emerald-700',
  warning: 'bg-amber-900/40 text-amber-400 border border-amber-700',
  danger: 'bg-red-900/40 text-red-400 border border-red-700',
}

export default function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
