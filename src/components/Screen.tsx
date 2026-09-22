import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface ScreenProps {
  children: ReactNode
  contentClassName?: string
  showHistoryLink?: boolean
  /** Enables a wider desktop composition instead of the same narrow mobile column stretched out. */
  wide?: boolean
  /** Desktop-only side panel (e.g. a live picks summary or session status) — hidden below lg. */
  side?: ReactNode
}

/**
 * Shared page shell. Mobile stays a single centered column at every width. On large screens,
 * `wide` switches to an intentional two-region composition (content + optional side panel)
 * instead of the same mobile card just floating in a wider void — see README's "Responsive
 * strategy" note for the full rationale.
 */
export function Screen({ children, contentClassName = '', showHistoryLink = false, wide = false, side }: ScreenProps) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-grain bg-ink-900">
      {/* Ambient glow — only becomes visually meaningful once there's room for it (lg+). */}
      <div className="ambient-backdrop hidden lg:block" aria-hidden="true">
        <div className="absolute -left-40 top-1/4 h-[32rem] w-[32rem] rounded-full bg-ember-600/10 blur-[120px]" />
        <div className="absolute -right-40 bottom-1/4 h-[36rem] w-[36rem] rounded-full bg-rose-600/10 blur-[130px]" />
      </div>

      <div className={`relative z-[1] mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] sm:max-w-lg sm:px-8 ${wide ? 'lg:max-w-5xl lg:px-12' : 'lg:max-w-2xl'}`}>
        {showHistoryLink && (
          <div className="mb-2 flex justify-end">
            <Link
              to="/history"
              className="btn-focus rounded-full px-3 py-1.5 text-xs font-medium text-parchment-300/70 transition-colors hover:text-ember-400"
            >
              History
            </Link>
          </div>
        )}

        {wide && side ? (
          <div className="grid flex-1 grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className={`flex flex-col ${contentClassName}`}>{children}</div>
            <aside className="hidden lg:sticky lg:top-10 lg:flex lg:flex-col">{side}</aside>
          </div>
        ) : (
          <div className={`flex flex-1 flex-col ${contentClassName}`}>{children}</div>
        )}
      </div>
    </div>
  )
}
