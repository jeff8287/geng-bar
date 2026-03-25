import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md bg-bar-card dark:bg-gray-800 border border-bar-border dark:border-gray-700 rounded-t-2xl sm:rounded-2xl p-6 z-10 max-h-[90vh] overflow-y-auto"
      >
        {title && <h3 className="font-semibold text-white mb-4">{title}</h3>}
        {children}
      </motion.div>
    </div>
  )
}
