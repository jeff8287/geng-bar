import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { CocktailListItem } from '../../types'
import Modal from '../ui/Modal'

interface CocktailRouletteProps {
  cocktails: CocktailListItem[]
}

const SPIN_DURATION = 2000
const TICK_INTERVAL = 80

export default function CocktailRoulette({ cocktails }: CocktailRouletteProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [current, setCurrent] = useState<CocktailListItem | null>(null)
  const [result, setResult] = useState<CocktailListItem | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const available = cocktails.filter(c => c.is_available)

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timerRef.current = null
    timeoutRef.current = null
  }, [])

  useEffect(() => cleanup, [cleanup])

  const spin = useCallback(() => {
    if (available.length === 0) return
    setSpinning(true)
    setResult(null)

    // Pick the final result upfront
    const finalIdx = Math.floor(Math.random() * available.length)
    const finalPick = available[finalIdx]

    // Rapid cycling through cocktails
    timerRef.current = setInterval(() => {
      const idx = Math.floor(Math.random() * available.length)
      setCurrent(available[idx])
    }, TICK_INTERVAL)

    // Stop after duration
    timeoutRef.current = setTimeout(() => {
      cleanup()
      setCurrent(finalPick)
      setResult(finalPick)
      setSpinning(false)
    }, SPIN_DURATION)
  }, [available, cleanup])

  function handleOpen() {
    setOpen(true)
    setCurrent(null)
    setResult(null)
    setSpinning(false)
  }

  function handleClose() {
    cleanup()
    setOpen(false)
    setSpinning(false)
    setCurrent(null)
    setResult(null)
  }

  function handleGoToDetail() {
    if (result) {
      handleClose()
      navigate(`/menu/${result.id}`)
    }
  }

  if (available.length < 2) return null

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-bar-gold/20 hover:bg-bar-gold/30 text-bar-gold border border-bar-gold/40 rounded-full transition-colors text-sm font-medium"
      >
        <motion.span
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="inline-block"
        >
          🎰
        </motion.span>
        {t('roulette.button')}
      </button>

      <Modal open={open} onClose={handleClose} title={t('roulette.title')}>
        <div className="flex flex-col items-center gap-5">
          {/* Slot display */}
          <div className="w-full h-40 bg-bar-bg rounded-xl border border-bar-border overflow-hidden flex items-center justify-center relative">
            <AnimatePresence mode="wait">
              {current ? (
                <motion.div
                  key={spinning ? current.id + Math.random() : current.id}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ duration: spinning ? 0.06 : 0.3 }}
                  className="flex flex-col items-center gap-2"
                >
                  <span className="text-4xl">
                    {current.image_url ? '🍸' : '🍹'}
                  </span>
                  <span className={`text-lg font-semibold text-center px-4 ${result ? 'text-bar-gold' : 'text-white'}`}>
                    {current.name}
                  </span>
                  {result && current.category && (
                    <span className="text-xs text-gray-400 capitalize">{current.category}</span>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <span className="text-5xl block mb-2">🎰</span>
                  <p className="text-gray-500 text-sm">{t('roulette.hint')}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Spinning glow effect */}
            {spinning && (
              <motion.div
                className="absolute inset-0 border-2 border-bar-gold/50 rounded-xl"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              />
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 w-full">
            {!result ? (
              <button
                onClick={spin}
                disabled={spinning}
                className="flex-1 py-3 rounded-xl font-semibold text-base transition-all disabled:opacity-50 bg-bar-gold text-bar-bg hover:bg-bar-gold-light"
              >
                {spinning ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="inline-block"
                  >
                    🎲
                  </motion.span>
                ) : (
                  t('roulette.spin')
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={spin}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm border border-bar-border text-gray-300 hover:border-bar-gold/40 hover:text-white transition-colors"
                >
                  {t('roulette.again')}
                </button>
                <button
                  onClick={handleGoToDetail}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm bg-bar-gold text-bar-bg hover:bg-bar-gold-light transition-colors"
                >
                  {t('roulette.goDetail')}
                </button>
              </>
            )}
          </div>

          <p className="text-gray-600 text-xs text-center">
            {t('roulette.pool', { count: available.length })}
          </p>
        </div>
      </Modal>
    </>
  )
}
