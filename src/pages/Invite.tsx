import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { motion, AnimatePresence } from 'framer-motion'
import { Screen } from '../components/Screen'
import { Button } from '../components/ui/Button'
import { StepIndicator } from '../components/ui/StepIndicator'
import { PicksSummary } from '../components/ui/PicksSummary'
import { useSession } from '../state/SessionContext'

type MilestoneStatus = 'done' | 'active' | 'pending'
interface Milestone {
  key: string
  label: string
  detail: string
  status: MilestoneStatus
}

function MilestoneRow({ milestone, isLast }: { milestone: Milestone; isLast: boolean }) {
  const { label, detail, status } = milestone
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors duration-300 ${
            status === 'done'
              ? 'border-sage-400 bg-sage-500/20 text-sage-300'
              : status === 'active'
                ? 'border-ember-400 bg-ember-500/15 text-ember-300'
                : 'border-ink-600 bg-ink-800/60 text-parchment-300/40'
          }`}
        >
          {status === 'done' ? (
            <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          ) : status === 'active' ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-ember-400 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-ember-400" />
            </span>
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-parchment-300/30" />
          )}
        </span>
        {!isLast && <span className={`mt-1 w-px flex-1 ${status === 'done' ? 'bg-sage-400/40' : 'bg-ink-600'}`} />}
      </div>
      <div className={`flex flex-col pb-6 ${status === 'pending' ? 'opacity-45' : ''}`}>
        <p className={`text-sm font-semibold ${status === 'done' ? 'text-sage-300' : status === 'active' ? 'text-parchment-100' : 'text-parchment-300/70'}`}>
          {label}
        </p>
        <p className="text-xs text-parchment-300/60">{detail}</p>
      </div>
    </div>
  )
}

export default function Invite() {
  const navigate = useNavigate()
  const { inviteLink, sessionId, dbSessionId, prefsA, prefsB, pool, isLoadingPool, partnerOnline } = useSession()
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')

  useEffect(() => {
    if (!prefsA) {
      navigate('/preferences/a', { replace: true })
    }
  }, [prefsA, navigate])

  useEffect(() => {
    if (pool.length > 0) navigate('/swipe')
  }, [pool.length, navigate])

  // submitHostPreferences kicks off createSession() without waiting for it, so the
  // page can render instantly — but the invite link/QR/code embed sessionId, which
  // is only real once that insert lands in the database. Sharing (or scanning) it
  // before then would send a partner to a session that doesn't exist yet, so hold
  // the invite screen on a loading state until dbSessionId is confirmed.
  if (prefsA && !dbSessionId) {
    return (
      <Screen contentClassName="justify-center">
        <div className="flex flex-col items-center gap-4 py-10 text-center" role="status" aria-live="polite">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink-600 border-t-ember-400 motion-reduce:animate-none motion-reduce:border-t-ink-600" />
          <p className="font-display text-lg text-parchment-100">Preparing your invite…</p>
        </div>
      </Screen>
    )
  }

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

  const partnerJoined = partnerOnline || !!prefsB
  const milestones: Milestone[] = [
    { key: 'invite', label: 'Invite ready', detail: 'Share the QR code, link, or session code below.', status: 'done' },
    {
      key: 'joined',
      label: 'Partner joined',
      detail: partnerJoined ? 'They opened your link.' : 'Waiting for them to scan or tap the link.',
      status: partnerJoined ? 'done' : 'active',
    },
    {
      key: 'choosing',
      label: 'Choosing preferences',
      detail: prefsB ? 'Done — answers stay private until you match.' : 'They answer the same questions privately.',
      status: prefsB ? 'done' : partnerJoined ? 'active' : 'pending',
    },
    {
      key: 'swiping',
      label: 'Getting your swipe deck ready',
      detail: isLoadingPool ? 'Matching moods, languages, and ratings…' : 'Titles you’ll both like, picked just now.',
      status: prefsB ? (pool.length > 0 ? 'done' : 'active') : 'pending',
    },
  ]

  return (
    <Screen
      wide
      side={
        prefsA ? (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="font-display text-lg font-semibold text-parchment-100">Your picks</h2>
              <p className="mt-1 text-sm text-parchment-300/65">Hidden from your partner until you match.</p>
            </div>
            <PicksSummary prefs={prefsA} />
          </div>
        ) : undefined
      }
    >
      <div className="flex flex-col items-center gap-7 py-6 text-center lg:items-start lg:text-left">
        <header className="w-full">
          <StepIndicator current={2} className="mb-4 justify-center lg:justify-start" />
          <h1 className="font-display text-2xl font-semibold text-parchment-100">Bring your partner in</h1>
          <p className="mx-auto mt-1 max-w-xs text-sm text-parchment-300/70 lg:mx-0 lg:max-w-sm">
            They&apos;ll set their own preferences privately — your choices stay hidden until you both match. Scan
            the QR, open the link, or enter the code on their own phone.
          </p>
        </header>

        <div className="flex w-full flex-col items-center gap-7 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
          <div className="flex flex-col items-center gap-5">
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

            <div className="flex w-full max-w-xs items-center gap-3 text-[11px] font-medium uppercase tracking-wide text-parchment-300/40">
              <span className="h-px flex-1 bg-ink-600" />
              or share the code
              <span className="h-px flex-1 bg-ink-600" />
            </div>
            <div className="w-full max-w-xs rounded-xl border border-dashed border-ink-500 bg-ink-800/40 px-4 py-3 text-center">
              <p className="font-mono text-lg font-semibold tracking-[0.3em] text-parchment-100">{sessionId}</p>
              <p className="mt-0.5 text-[11px] text-parchment-300/50">Enter this on the "Join a session" screen</p>
            </div>

            <Button variant="ghost" size="md" onClick={() => navigate(`/join/${sessionId}`)}>
              Continue as Partner B on this device
            </Button>
          </div>

          <div className="w-full max-w-xs rounded-2xl border border-ink-600 bg-ink-800/40 p-5 text-left lg:max-w-sm">
            <AnimatePresence initial={false}>
              {milestones.map((m, i) => (
                <motion.div key={m.key} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <MilestoneRow milestone={m} isLast={i === milestones.length - 1} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Screen>
  )
}
