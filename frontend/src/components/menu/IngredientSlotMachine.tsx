import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { getAvailableIngredients } from '../../api/cocktails'
import type { Ingredient } from '../../types'
import Modal from '../ui/Modal'

const SLOT_TICK = 70
const SLOT_DELAYS = [1200, 2000, 2800]
const MAX_SPIRITS = 2

/** A slot can show a spirit category (e.g. "Gin") or a specific ingredient */
interface SlotItem {
  id: string
  displayName: string
  category: string
  isSpirit: boolean
}

function buildSlotPool(ingredients: Ingredient[]): SlotItem[] {
  const items: SlotItem[] = []
  const seenSpiritSubs = new Set<string>()

  for (const ing of ingredients) {
    const isSpiritCategory = ing.category.toLowerCase() === 'spirits'

    if (isSpiritCategory && ing.subcategory && ing.subcategory.toLowerCase() !== 'etc') {
      // Group spirits by subcategory — one slot item per subcategory
      const sub = ing.subcategory
      if (!seenSpiritSubs.has(sub)) {
        seenSpiritSubs.add(sub)
        items.push({
          id: `spirit-${sub}`,
          displayName: sub,
          category: 'Spirits',
          isSpirit: true,
        })
      }
    } else {
      // Specific ingredient (non-spirit, or spirit etc)
      items.push({
        id: `ing-${ing.id}`,
        displayName: ing.name,
        category: ing.category,
        isSpirit: isSpiritCategory,
      })
    }
  }
  return items
}

interface SlotProps {
  label: string
  current: SlotItem | null
  stopped: boolean
  index: number
}

function Slot({ label, current, stopped, index }: SlotProps) {
  const colors = ['text-cyan-400', 'text-pink-400', 'text-amber-400']
  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      <div className="w-full h-20 bg-bar-bg rounded-lg border border-bar-border flex items-center justify-center overflow-hidden relative">
        <AnimatePresence mode="wait">
          {current ? (
            <motion.div
              key={stopped ? `final-${current.id}` : `spin-${current.id}-${Math.random()}`}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ duration: stopped ? 0.3 : 0.05 }}
              className="text-center px-2"
            >
              <span className={`text-sm font-semibold ${stopped ? colors[index] : 'text-white'}`}>
                {current.displayName}
              </span>
              {stopped && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-[10px] text-gray-500 capitalize mt-0.5"
                >
                  {current.category}
                </motion.p>
              )}
            </motion.div>
          ) : (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              className="text-2xl"
            >
              ?
            </motion.span>
          )}
        </AnimatePresence>
        {!stopped && current && (
          <motion.div
            className="absolute inset-0 border border-bar-gold/40 rounded-lg"
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ repeat: Infinity, duration: 0.4 }}
          />
        )}
      </div>
    </div>
  )
}

function pickRandom(pool: SlotItem[]): SlotItem | null {
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

const BASE_CATEGORIES = new Set(['spirits', 'liqueurs'])

function pick3(pool: SlotItem[]): [SlotItem | null, SlotItem | null, SlotItem | null] {
  const picked: SlotItem[] = []

  for (let i = 0; i < 3; i++) {
    const pickedIds = new Set(picked.map(p => p.id))
    const spiritCount = picked.filter(p => p.isSpirit).length

    const available = pool.filter(item => {
      if (pickedIds.has(item.id)) return false
      if (item.isSpirit && spiritCount >= MAX_SPIRITS) return false
      // Slot 1: only spirits or liqueurs
      if (i === 0 && !BASE_CATEGORIES.has(item.category.toLowerCase())) return false
      return true
    })

    const item = pickRandom(available)
    if (item) picked.push(item)
  }

  return [picked[0] ?? null, picked[1] ?? null, picked[2] ?? null]
}

export default function IngredientSlotMachine() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [done, setDone] = useState(false)
  const [spinKey, setSpinKey] = useState(0)
  const [slots, setSlots] = useState<(SlotItem | null)[]>([null, null, null])
  const [stopped, setStopped] = useState([false, false, false])
  const timersRef = useRef<ReturnType<typeof setTimeout | typeof setInterval>[]>([])

  const { data: ingredients = [] } = useQuery({
    queryKey: ['available-ingredients'],
    queryFn: getAvailableIngredients,
    enabled: open,
    staleTime: 60_000,
  })

  const pool = useMemo(() => buildSlotPool(ingredients), [ingredients])

  const cleanup = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current.forEach(t => clearInterval(t))
    timersRef.current = []
  }, [])

  useEffect(() => cleanup, [cleanup])

  const spin = useCallback(() => {
    if (pool.length < 3) return
    cleanup()
    setSpinning(true)
    setDone(false)
    setSpinKey(k => k + 1)
    setStopped([false, false, false])
    setSlots([null, null, null])

    const finals = pick3(pool)
    const basePool = pool.filter(item => BASE_CATEGORIES.has(item.category.toLowerCase()))

    for (let i = 0; i < 3; i++) {
      const spinPool = i === 0 ? basePool : pool
      const interval = setInterval(() => {
        setSlots(prev => {
          const next = [...prev]
          next[i] = spinPool[Math.floor(Math.random() * spinPool.length)]
          return next
        })
      }, SLOT_TICK + i * 10)
      timersRef.current.push(interval)

      const stopTimer = setTimeout(() => {
        clearInterval(interval)
        setSlots(prev => {
          const next = [...prev]
          next[i] = finals[i]
          return next
        })
        setStopped(prev => {
          const next = [...prev]
          next[i] = true
          return next
        })
        if (i === 2) {
          setSpinning(false)
          setDone(true)
        }
      }, SLOT_DELAYS[i])
      timersRef.current.push(stopTimer)
    }
  }, [pool, cleanup])

  function handleOpen() {
    setOpen(true)
    setSlots([null, null, null])
    setStopped([false, false, false])
    setDone(false)
    setSpinning(false)
  }

  function handleClose() {
    cleanup()
    setOpen(false)
    setSpinning(false)
  }

  const slotLabels = [
    t('slotMachine.slot1'),
    t('slotMachine.slot2'),
    t('slotMachine.slot3'),
  ]

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-full transition-colors text-sm font-medium"
      >
        <motion.span
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="inline-block"
        >
          🧪
        </motion.span>
        {t('slotMachine.button')}
      </button>

      <Modal open={open} onClose={handleClose} title={t('slotMachine.title')}>
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-400 text-sm text-center">{t('slotMachine.description')}</p>

          {/* 3 Slot Reels */}
          <div className="flex gap-3 w-full">
            {[0, 1, 2].map(i => (
              <Slot
                key={`${spinKey}-${i}`}
                label={slotLabels[i]}
                current={slots[i]}
                stopped={stopped[i]}
                index={i}
              />
            ))}
          </div>

          {/* Spin / Again Button */}
          <button
            onClick={spin}
            disabled={spinning || pool.length < 3}
            className="w-full py-3 rounded-xl font-semibold text-base transition-all disabled:opacity-50 bg-purple-600 text-white hover:bg-purple-500"
          >
            {spinning ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="inline-block"
              >
                🎲
              </motion.span>
            ) : done ? (
              t('slotMachine.again')
            ) : (
              t('slotMachine.spin')
            )}
          </button>

          <p className="text-gray-600 text-xs text-center">
            {t('slotMachine.pool', { count: pool.length })}
          </p>
        </div>
      </Modal>
    </>
  )
}
