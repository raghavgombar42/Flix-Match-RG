import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { motion } from 'framer-motion'
import { Screen } from '../components/Screen'
import { Button } from '../components/ui/Button'
import { useSession } from '../state/SessionContext'

export default function Invite() {
  const navigate = useNavigate()
  const { inviteLink, sessionId, prefsA, prefsB, pool, isLoadingPool } = useSession()
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')

  useEffect(() => {
    if (!prefsA) {
      navigate('/preferences/a', { replace: true })
    }
  }, [prefsA, navigate])

  useEffect(() => {
    if (pool.length > 0) navigate('/swipe')
  }, [pool.length, navigate])

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteLink)
        setCopyState('copied')
      } else {
        throw new Error('Clipboard API unavailable')
      }
    } catch {
      setCopyState('error')
    }
    setTimeout(() => setCopyState('idle'), 2200)
  }

  async function handleShare() {
    const shareData = {
      title: 'FlixMatch',
      text: 'Join my FlixMatch session — let’s find something to watch tonight.',
      url: inviteLink,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // user cancelled — no-op
      }
    } else {
      await handleCopy()
    }
  }

  return (
    <Screen contentClassName="justify-center">
      <div className="flex flex-col items-center gap-7 py-6 text-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ember-400">Step 1 of 2 · Invite</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-parchment-100">Bring your partner in</h1>
          <p className="mx-auto mt-1 max-w-xs text-sm text-parchment-300/70">
            They&apos;ll set their own preferences privately — your choices stay hidden until you both match. Scan the
            QR or open the link on their own phone.
          </p>
        </div>

        <div className="rounded-3xl border border-ink-500 bg-parchment-100 p-4 shadow-card">
          <QRCodeSVG value={inviteLink} size={176} bgColor="#FBF6EF" fgColor="#120E0C" level="M" />
        </div>

        <div className="flex w-full max-w-xs flex-col gap-2">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-ink-500 bg-ink-800/70 px-3 py-2.5 text-left">
            <span className="truncate text-xs text-parchment-300/80">{inviteLink}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={handleCopy}>
              {copyState === 'copied' ? 'Copied ✓' : copyState === 'error' ? 'Copy failed' : 'Copy link'}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={handleShare}>
              Share
            </Button>
          </div>
        </div>

        <div className="mt-2 flex min-h-[74px] w-full max-w-xs flex-col items-center justify-center gap-3 rounded-2xl border border-ink-600 bg-ink-800/50 px-4 py-4">
          {!prefsB ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-ember-400" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-ember-400" />
              </span>
              <p className="text-sm font-medium text-parchment-200">Waiting for your partner to join…</p>
              <Button variant="ghost" size="md" onClick={() => navigate(`/join/${sessionId}`)}>
                Continue as Partner B on this device
              </Button>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <p className="text-sm font-semibold text-sage-400">Your partner has joined ✓</p>
              <p className="text-xs text-parchment-300/65">{isLoadingPool ? 'Finding titles you’ll both like…' : 'Getting your swipe deck ready…'}</p>
            </motion.div>
          )}
        </div>
      </div>
    </Screen>
  )
}
