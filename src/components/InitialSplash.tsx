'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'

const MIN_SPLASH_MS = 2200
const FADE_OUT_MS = 520
const EMBER_COUNT = 30

type SplashPhase = 'visible' | 'fading' | 'hidden'

type Ember = {
  id: number
  left: number
  size: number
  delay: number
  duration: number
  drift: number
  opacity: number
  hue: number
}

/** Deterministic pseudo-random so SSR + client agree (no hydration mismatch). */
function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function buildEmbers(): Ember[] {
  return Array.from({ length: EMBER_COUNT }, (_, i) => {
    const r1 = seeded(i + 1)
    const r2 = seeded(i * 2 + 3)
    const r3 = seeded(i * 3 + 7)
    const r4 = seeded(i * 5 + 11)
    const r5 = seeded(i * 7 + 13)
    const r6 = seeded(i * 11 + 17)
    return {
      id: i,
      left: r1 * 100,
      size: 1.2 + r2 * 3.6,
      // Negative delays so embers are already mid-flight on first paint.
      delay: -(r3 * 14),
      duration: 8 + r4 * 9,
      drift: (r5 - 0.5) * 100,
      opacity: 0.35 + r2 * 0.55,
      // Two slightly different golds keep the field from feeling synthetic.
      hue: r6 < 0.32 ? 36 : 44,
    }
  })
}

export function InitialSplash() {
  const [phase, setPhase] = useState<SplashPhase>('visible')
  const embers = useMemo(() => buildEmbers(), [])

  useEffect(() => {
    let cancelled = false
    let fadeTimeout: number | null = null
    let onLoad: (() => void) | null = null

    const minDelayPromise = new Promise<void>((resolve) => {
      window.setTimeout(resolve, MIN_SPLASH_MS)
    })

    const readyPromise = new Promise<void>((resolve) => {
      if (document.readyState === 'complete') {
        resolve()
        return
      }
      onLoad = () => resolve()
      window.addEventListener('load', onLoad, { once: true })
    })

    Promise.all([minDelayPromise, readyPromise]).then(() => {
      if (cancelled) return
      setPhase('fading')
      fadeTimeout = window.setTimeout(() => {
        if (!cancelled) setPhase('hidden')
      }, FADE_OUT_MS)
    })

    return () => {
      cancelled = true
      if (fadeTimeout != null) window.clearTimeout(fadeTimeout)
      if (onLoad) window.removeEventListener('load', onLoad)
    }
  }, [])

  if (phase === 'hidden') return null

  return (
    <div
      aria-live="polite"
      aria-label="Loading Zenvana"
      role="status"
      className={[
        'zv-splash fixed inset-0 z-[260] flex items-center justify-center overflow-hidden',
        'transition-opacity duration-[520ms] ease-out motion-reduce:transition-none',
        phase === 'fading' ? 'pointer-events-none opacity-0' : 'opacity-100',
      ].join(' ')}
    >
      {/* Hearth glow at the base — the source of the embers */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%] zv-hearth" />

      {/* Soft top vignette so the logo region feels luminous, not floating in nothing */}
      <div className="pointer-events-none absolute inset-0 zv-vignette" />

      {/* Ember field */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
      >
        {embers.map((e) => (
          <span
            key={e.id}
            className="zv-ember"
            style={{
              left: `${e.left}%`,
              width: `${e.size}px`,
              height: `${e.size}px`,
              animationDelay: `${e.delay}s`,
              animationDuration: `${e.duration}s`,
              ['--ember-drift' as string]: `${e.drift}px`,
              ['--ember-op' as string]: `${e.opacity}`,
              ['--ember-hue' as string]: `${e.hue}`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Iris burst that blooms once behind the logo */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="zv-iris" />
      </div>

      {/* Center content */}
      <div className="relative z-10 px-6 text-center text-white">
        <p className="zv-welcome text-[10px] uppercase text-white/55">Welcome to</p>

        <h1 className="zv-title mt-3 text-3xl font-semibold tracking-[0.18em] text-white sm:text-4xl">
          Zenvana Payments
        </h1>

        <div className="zv-logo-wrap mx-auto mt-4">
          <Image
            src="/Zenvana%20logo/icon.svg"
            alt="Zenvana"
            width={220}
            height={220}
            className="zv-logo mx-auto h-auto w-[clamp(140px,24vw,220px)]"
            priority
            unoptimized
            sizes="(max-width: 640px) 140px, (max-width: 1024px) 24vw, 220px"
          />
        </div>

        <p className="zv-tagline mt-3 text-xs text-white/70 sm:text-sm">
          Boutique stays on Rajpur Road
        </p>

        <div className="zv-rule mx-auto mt-7" />

        <div className="zv-dots mt-5 inline-flex items-center gap-2" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      </div>

      <style>{zvCss}</style>
    </div>
  )
}

const zvCss = `
.zv-splash {
  background:
    radial-gradient(70% 55% at 50% 110%, rgba(212,175,55,0.10) 0%, transparent 60%),
    radial-gradient(60% 45% at 50% -10%, rgba(212,175,55,0.04) 0%, transparent 60%),
    #050505;
}
.zv-vignette {
  background: radial-gradient(closest-side at 50% 45%, rgba(232,214,147,0.06), transparent 70%);
  mix-blend-mode: screen;
}
.zv-hearth {
  background:
    radial-gradient(70% 100% at 50% 100%,
      rgba(232,214,147,0.20) 0%,
      rgba(232,214,147,0.06) 35%,
      transparent 65%);
  -webkit-mask-image: linear-gradient(to top, black 0%, transparent 100%);
          mask-image: linear-gradient(to top, black 0%, transparent 100%);
  animation: zv-hearth-pulse 6s ease-in-out infinite alternate;
}
@keyframes zv-hearth-pulse {
  0%   { opacity: 0.65; }
  100% { opacity: 1; }
}

/* ---------- Embers ---------- */
.zv-ember {
  position: absolute;
  bottom: -8px;
  border-radius: 9999px;
  background: hsl(var(--ember-hue, 42), 78%, 64%);
  box-shadow:
    0 0 6px hsla(var(--ember-hue, 42), 80%, 60%, 0.9),
    0 0 14px hsla(var(--ember-hue, 42), 80%, 55%, 0.5);
  opacity: 0;
  will-change: transform, opacity;
  animation-name: zv-ember-rise;
  animation-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1);
  animation-iteration-count: infinite;
  animation-fill-mode: both;
}
@keyframes zv-ember-rise {
  0%   { transform: translate3d(0, 0, 0) scale(0.45); opacity: 0; }
  8%   {                                              opacity: var(--ember-op, 0.6); }
  25%  { transform: translate3d(calc(var(--ember-drift, 30px) *  1),  -25vh, 0) scale(0.85); }
  50%  { transform: translate3d(calc(var(--ember-drift, 30px) * -1),  -50vh, 0) scale(1);    }
  75%  { transform: translate3d(calc(var(--ember-drift, 30px) *  0.6), -75vh, 0) scale(0.92); }
  92%  {                                              opacity: calc(var(--ember-op, 0.6) * 0.35); }
  100% { transform: translate3d(0, -108vh, 0) scale(0.35); opacity: 0; }
}

/* ---------- Iris bloom behind logo ---------- */
.zv-iris {
  width: 1px; height: 1px;
  border-radius: 9999px;
  background: radial-gradient(circle,
    rgba(232,214,147,0.85) 0%,
    rgba(232,214,147,0.18) 40%,
    rgba(232,214,147,0)    70%);
  filter: blur(8px);
  animation: zv-iris-bloom 1700ms cubic-bezier(0.16, 1, 0.3, 1) 220ms forwards;
}
@keyframes zv-iris-bloom {
  0%   { width: 0;     height: 0;     opacity: 0;    filter: blur(2px); }
  35%  {                              opacity: 0.95; }
  100% { width: 620px; height: 620px; opacity: 0;    filter: blur(32px); }
}

/* ---------- Welcome ---------- */
.zv-welcome {
  opacity: 0;
  letter-spacing: 0.18em;
  animation: zv-welcome-in 1200ms cubic-bezier(0.22, 0.61, 0.36, 1) 180ms forwards;
}
@keyframes zv-welcome-in {
  0%   { opacity: 0; letter-spacing: 0.18em; }
  100% { opacity: 1; letter-spacing: 0.42em; }
}

/* ---------- Title ---------- */
.zv-title {
  opacity: 0;
  transform: translateY(8px);
  text-shadow: 0 0 22px rgba(232,214,147,0.22);
  animation: zv-title-in 950ms cubic-bezier(0.22, 0.61, 0.36, 1) 360ms forwards;
}
@keyframes zv-title-in {
  to { opacity: 1; transform: translateY(0); }
}

/* ---------- Logo: scale + de-blur entrance, then breathe with halo ---------- */
.zv-logo-wrap {
  position: relative;
  display: inline-block;
  isolation: isolate;
}
.zv-logo-wrap::before {
  content: '';
  position: absolute;
  inset: -24%;
  border-radius: 50%;
  background: radial-gradient(closest-side,
    rgba(232,214,147,0.24),
    rgba(232,214,147,0.05) 55%,
    transparent 70%);
  filter: blur(20px);
  opacity: 0;
  z-index: -1;
  animation:
    zv-halo-in       1600ms cubic-bezier(0.22, 0.61, 0.36, 1) 380ms forwards,
    zv-halo-breathe  6s     ease-in-out                       2.3s    infinite alternate;
}
@keyframes zv-halo-in {
  0%   { opacity: 0;   transform: scale(0.7); }
  100% { opacity: 0.9; transform: scale(1);   }
}
@keyframes zv-halo-breathe {
  0%   { opacity: 0.8; transform: scale(1);    }
  100% { opacity: 1;   transform: scale(1.07); }
}

.zv-logo {
  opacity: 0;
  transform: translateY(0) scale(0.88);
  filter:
    drop-shadow(0 0 0 rgba(232,214,147,0))
    blur(8px);
  animation:
    zv-logo-in      1500ms cubic-bezier(0.22, 0.61, 0.36, 1) 320ms forwards,
    zv-logo-breathe 6.5s   ease-in-out                        2.5s   infinite alternate;
  will-change: transform, opacity, filter;
}
@keyframes zv-logo-in {
  0%   { opacity: 0; transform: translateY(0)  scale(0.88);
         filter: drop-shadow(0 0 0 rgba(232,214,147,0)) blur(8px); }
  55%  { opacity: 1; }
  100% { opacity: 1; transform: translateY(0)  scale(1);
         filter:
           drop-shadow(0 0 22px rgba(232,214,147,0.38))
           drop-shadow(0 0 60px rgba(232,214,147,0.22))
           blur(0); }
}
@keyframes zv-logo-breathe {
  0%   { transform: translateY(0)    scale(1);
         filter:
           drop-shadow(0 0 22px rgba(232,214,147,0.32))
           drop-shadow(0 0 60px rgba(232,214,147,0.18)) blur(0); }
  100% { transform: translateY(-3px) scale(1.012);
         filter:
           drop-shadow(0 0 30px rgba(232,214,147,0.46))
           drop-shadow(0 0 82px rgba(232,214,147,0.28)) blur(0); }
}

/* ---------- Tagline ---------- */
.zv-tagline {
  opacity: 0;
  transform: translateY(8px);
  letter-spacing: 0.22em;
  animation: zv-tagline-in 900ms cubic-bezier(0.22, 0.61, 0.36, 1) 1050ms forwards;
}
@keyframes zv-tagline-in {
  to { opacity: 1; transform: translateY(0); }
}

/* ---------- Gold rule that draws from the center ---------- */
.zv-rule {
  height: 1px;
  width: 0;
  background: linear-gradient(to right, transparent, #E8D693 50%, transparent);
  animation: zv-rule-draw 1100ms cubic-bezier(0.22, 0.61, 0.36, 1) 1200ms forwards;
}
@keyframes zv-rule-draw {
  to { width: 8rem; }
}

/* ---------- Three dots ---------- */
.zv-dots {
  opacity: 0;
  animation: zv-dots-in 600ms ease 1550ms forwards;
}
.zv-dots > span {
  width: 6px; height: 6px;
  border-radius: 9999px;
  background: #E8D693;
  box-shadow: 0 0 8px rgba(232,214,147,0.6);
  animation: zv-dot-pulse 1500ms ease-in-out infinite;
}
.zv-dots > span:nth-child(2) { animation-delay: 220ms; }
.zv-dots > span:nth-child(3) { animation-delay: 440ms; }
@keyframes zv-dots-in   { to { opacity: 1; } }
@keyframes zv-dot-pulse {
  0%, 100% { opacity: 0.35; transform: scale(0.85); }
  50%      { opacity: 1;    transform: scale(1.08); }
}

/* ---------- Accessibility: respect reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .zv-welcome, .zv-title, .zv-logo, .zv-tagline, .zv-rule, .zv-dots,
  .zv-logo-wrap::before, .zv-hearth {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
  }
  .zv-welcome { letter-spacing: 0.34em; }
  .zv-rule    { width: 8rem; }
  .zv-logo    {
    filter:
      drop-shadow(0 0 22px rgba(232,214,147,0.38))
      drop-shadow(0 0 60px rgba(232,214,147,0.22)) !important;
  }
  .zv-iris    { display: none; }
}
`