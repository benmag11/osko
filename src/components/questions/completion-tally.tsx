'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { motion, useAnimationControls, useReducedMotion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Check, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuestionCompletions } from '@/lib/hooks/use-question-completions'
import { useCompletionAnimations } from '@/lib/hooks/use-completion-animations'
import styles from './styles/question-card.module.css'

interface CompletionTallyProps {
  questionId: string
  questionType?: 'normal' | 'audio'
}

const DRAW_DURATION_SECONDS = 3
const DRAW_DURATION_MS = DRAW_DURATION_SECONDS * 1000
const FINISH_FLASH_DURATION_SECONDS = 0.32
const FINISH_FLASH_SCALE = 1.04
const FINISH_FLASH_BRIGHTNESS = 1.18

/**
 * Animated or static SVG path for a single tally stroke.
 * When animating, Motion measures the real pixel length via getTotalLength()
 * and interpolates stroke-dashoffset over absolute values — avoiding the
 * browser rounding issue that made CSS pathLength={1} animations instant.
 */
function TallyPath({ d, animate }: { d: string; animate: boolean }) {
  return (
    <motion.path
      d={d}
      initial={animate ? { pathLength: 0 } : false}
      animate={{ pathLength: 1 }}
      transition={
        animate
          ? { pathLength: { duration: DRAW_DURATION_SECONDS, ease: [0.25, 0.1, 0.25, 1] } }
          : { duration: 0 }
      }
    />
  )
}

/**
 * Renders tally marks as inline SVGs.
 * Full groups of 5: 4 vertical strokes + 1 diagonal slash.
 * Remainder (1–4): just vertical strokes.
 * Uses currentColor so the parent's text color flows through.
 */
function TallyMarks({ count, drawIndex }: { count: number; drawIndex: number | null }) {
  const prefersReducedMotion = useReducedMotion()
  const { animationsEnabled } = useCompletionAnimations()
  if (count === 0) return null

  const fullGroups = Math.floor(count / 5)
  const remainder = count % 5

  const shouldAnimate = (flatIndex: number) =>
    drawIndex === flatIndex && !prefersReducedMotion && animationsEnabled

  return (
    <div className="flex items-center gap-[0.3em]">
      {Array.from({ length: fullGroups }, (_, i) => (
        <svg
          key={`g${i}`}
          viewBox="0 0 22 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={styles.tallyMark}
          aria-hidden="true"
        >
          {/* 4 vertical strokes */}
          <TallyPath d="M3 1L3 15" animate={shouldAnimate(i * 5)} />
          <TallyPath d="M7 1L7 15" animate={shouldAnimate(i * 5 + 1)} />
          <TallyPath d="M11 1L11 15" animate={shouldAnimate(i * 5 + 2)} />
          <TallyPath d="M15 1L15 15" animate={shouldAnimate(i * 5 + 3)} />
          {/* Diagonal slash through the group */}
          <TallyPath d="M1 13L17 3" animate={shouldAnimate(i * 5 + 4)} />
        </svg>
      ))}
      {remainder > 0 && (
        <svg
          viewBox={`0 0 ${remainder * 4 + 2} 16`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={styles.tallyMark}
          aria-hidden="true"
        >
          {Array.from({ length: remainder }, (_, j) => (
            <TallyPath
              key={j}
              d={`M${j * 4 + 2} 1L${j * 4 + 2} 15`}
              animate={shouldAnimate(fullGroups * 5 + j)}
            />
          ))}
        </svg>
      )}
    </div>
  )
}

export const CompletionTally = memo(function CompletionTally({
  questionId,
  questionType = 'normal',
}: CompletionTallyProps) {
  const { completionCounts, addCompletion, undoCompletion, isLoading } = useQuestionCompletions()
  const prefersReducedMotion = useReducedMotion()
  const { animationsEnabled } = useCompletionAnimations()
  const tallyMarksControls = useAnimationControls()
  const count = completionCounts.get(questionId) ?? 0

  const hasHydrated = useRef(false)
  const prevCountRef = useRef(count)
  const animationTokenRef = useRef(0)
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [drawIndex, setDrawIndex] = useState<number | null>(null)
  const justIncremented = hasHydrated.current && count > prevCountRef.current && !prefersReducedMotion && animationsEnabled
  const activeDrawIndex = justIncremented ? count - 1 : drawIndex

  const clearFinishTimer = useCallback(() => {
    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current)
      finishTimerRef.current = null
    }
  }, [])

  const resetMarkAnimation = useCallback(() => {
    clearFinishTimer()
    setDrawIndex(null)
    tallyMarksControls.stop()
    tallyMarksControls.set({ scale: 1, filter: 'brightness(1)' })
  }, [clearFinishTimer, tallyMarksControls])

  useEffect(() => {
    if (!isLoading) hasHydrated.current = true
  }, [isLoading])

  useEffect(() => {
    if (!hasHydrated.current) {
      prevCountRef.current = count
      return
    }

    const previousCount = prevCountRef.current
    if (count > previousCount && !prefersReducedMotion && animationsEnabled) {
      const token = animationTokenRef.current + 1
      animationTokenRef.current = token

      clearFinishTimer()
      setDrawIndex(count - 1)
      tallyMarksControls.stop()
      tallyMarksControls.set({ scale: 1, filter: 'brightness(1)' })

      finishTimerRef.current = setTimeout(() => {
        if (animationTokenRef.current !== token) return

        setDrawIndex(null)
        void tallyMarksControls.start({
          scale: [1, FINISH_FLASH_SCALE, 1],
          filter: ['brightness(1)', `brightness(${FINISH_FLASH_BRIGHTNESS})`, 'brightness(1)'],
          transition: {
            duration: FINISH_FLASH_DURATION_SECONDS,
            ease: [0.25, 0.1, 0.25, 1],
            times: [0, 0.45, 1],
          },
        })
      }, DRAW_DURATION_MS)
    } else if (count < previousCount || prefersReducedMotion || !animationsEnabled) {
      animationTokenRef.current += 1
      resetMarkAnimation()
    }

    prevCountRef.current = count
  }, [
    count,
    animationsEnabled,
    clearFinishTimer,
    prefersReducedMotion,
    resetMarkAnimation,
    tallyMarksControls,
  ])

  useEffect(() => {
    return () => {
      clearFinishTimer()
      tallyMarksControls.stop()
    }
  }, [clearFinishTimer, tallyMarksControls])

  return (
    <div
      className={cn(
        'flex items-center rounded-md',
        count > 0 && 'gap-[0.35em] border border-[#ED805E] pl-[0.4em]',
        styles.tallyWrapper,
      )}
    >
      {count > 0 && (
        <>
          {/* Tally marks */}
          <motion.div
            className="flex items-center text-[#ED805E]"
            animate={tallyMarksControls}
            style={{ transformOrigin: 'center center' }}
          >
            <TallyMarks count={count} drawIndex={activeDrawIndex} />
          </motion.div>

          {/* Undo button */}
          <button
            onClick={() => undoCompletion(questionId, questionType)}
            className={cn(
              'flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors',
              styles.iconButton,
            )}
            title="Undo last completion"
          >
            <Undo2 className={cn('h-4 w-4', styles.tallyIcon)} />
          </button>
        </>
      )}

      {/* Tick button — always rendered identically */}
      <Button
        onClick={() => addCompletion(questionId, questionType)}
        size="sm"
        variant="outline"
        className={cn(
          'p-2 text-stone-400 hover:bg-transparent hover:text-stone-600 transition-colors',
          count > 0 && 'border-0',
          styles.iconButton,
        )}
        title="Mark as completed"
      >
        <Check className={cn('h-4 w-4', styles.tallyIcon)} />
      </Button>
    </div>
  )
})
