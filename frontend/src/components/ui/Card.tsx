import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export default function Card({ hover, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-bar-card dark:bg-gray-800 border border-bar-border dark:border-gray-700 rounded-xl overflow-hidden ${
        hover ? 'hover:border-bar-gold/40 transition-colors cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
