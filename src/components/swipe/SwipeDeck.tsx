import { useCallback, useEffect, useRef, useState } from 'react'
import { SwipeCard } from './SwipeCard'
import type { Title } from '../../types'

interface SwipeDeckProps {
  upcoming: Title[]
  onSwipe: (title: Title, direction: 'like' | 'pass') => void
}

const STACK_DEPTH = 3
const EXIT_ANIMATION_MS = 260

export function SwipeDeck({ upcoming, onSwipe }: SwipeDeckProps) {
  const visible = upcoming.slice(0, STACK_DEPTH)
  const top = visible[0]
  const [pendingDirection, setPendingDirection] = useState<'like' | 'pass' | null>(null)
  const pendingRef = useRef<{ title: Title; direction: 'like' | 'pass' } | null>(null)

  const triggerDecision = useCallback(
    (direction: 'like' | 'pass') => {
      if (!top || pendingRef.current) return
      pendingRef.current = { title: top, direction }
      setPendingDirection(direction)
    },
    [top],
  )

  // The card animates out declaratively and independently; app state advances on a fixed timer
  // rather than waiting on the animation to report completion, so swiping never stalls.
  useEffect(() => {
    if (!pendingDirection || !pendingRef.current) return
    const { title, direction } = pendingRef.current
    const timer = setTimeout(() => {
      onSwipe(title, direction)
      pendingRef.current = null
      setPendingDirection(null)
    }, EXIT_ANIMATION_MS)
    return () => clearTimeout(timer)
  }, [pendingDirection, onSwipe])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') triggerDecision('like')
      if (e.key === 'ArrowLeft') triggerDecision('pass')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [triggerDecision])

  if (!top) return null

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-[62vh] max-h-[560px] w-full max-w-sm">
        {visible
          .map((title, i) => (
            <SwipeCard
              key={title.id}
              title={title}
              isTop={i === 0}
              stackIndex={i}
              pendingDirection={i === 0 ? pendingDirection : null}
              onDragDecision={triggerDecision}
            />
          ))
          .reverse()}
      </div>

      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => triggerDecision('pass')}
          aria-label={`Pass on ${top.name}`}
          className="btn-focus flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink-500 bg-ink-800/80 text-rose-400 shadow-card transition-transform hover:scale-105 hover:border-rose-400/60 active:scale-95"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => triggerDecision('like')}
          aria-label={`Like ${top.name}`}
          className="btn-focus flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-2 border-ember-400/70 bg-gradient-to-b from-ember-400 to-ember-600 text-ink-950 shadow-glow transition-transform hover:scale-105 active:scale-95"
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 20.5s-7.5-4.6-10-9.3C.5 8 2 4.5 5.6 4c2-.3 3.9.7 5 2.3C11.7 4.7 13.6 3.7 15.6 4c3.6.5 5.1 4 3.6 7.2-2.5 4.7-10 9.3-10 9.3z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
