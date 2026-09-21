import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface ScreenProps {
  children: ReactNode
  contentClassName?: string
  showHistoryLink?: boolean
}

/** Shared page shell: centers content in a mobile-first column, roomy on desktop. */
export function Screen({ children, contentClassName = '', showHistoryLink = false }: ScreenProps) {
  return (
    <div className="min-h-[100dvh] bg-grain bg-ink-900">
      <div className={`mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] sm:max-w-lg sm:px-8 lg:max-w-2xl ${contentClassName}`}>
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
        {children}
      </div>
    </div>
  )
}
