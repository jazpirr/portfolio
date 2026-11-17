import { useEffect, useRef, useState } from 'react'

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ── Pixel starfield background ───────────────────────────── */

export function Starfield({ className = 'pointer-events-none fixed inset-0 -z-10' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let w = 0
    let h = 0
    let raf = 0
    let frame = 0
    let last = 0
    let color = '#fff'
    const stars = Array.from({ length: 70 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 1 + Math.floor(Math.random() * 3), // 1..3 → size & speed
      t: Math.random() * 100,
    }))

    const resize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    const readColor = () => {
      color = getComputedStyle(document.documentElement).getPropertyValue('--star').trim() || '#fff'
    }
    const draw = (move: boolean) => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = color
      const scroll = window.scrollY
      for (const s of stars) {
        if (move) s.x -= 0.0003 * s.z
        if (s.x < 0) s.x += 1
        const px = Math.floor(s.x * w)
        const py = Math.floor((((s.y * h - scroll * 0.05 * s.z) % h) + h) % h)
        const size = s.z * 2
        const tw = (frame + s.t) % 60 < 4 ? 0.2 : 0.25 + s.z * 0.15
        ctx.globalAlpha = tw
        ctx.fillRect(px, py, size, size)
      }
      ctx.globalAlpha = 1
    }
    // ~24 fps is plenty for drifting pixels and keeps the main thread free.
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop)
      if (document.hidden || t - last < 42) return
      last = t
      frame++
      draw(true)
    }

    resize()
    readColor()
    window.addEventListener('resize', resize)
    const onTheme = () => {
      readColor()
      draw(false)
    }
    window.addEventListener('themechange', onTheme)
    if (reducedMotion()) {
      draw(false)
    } else {
      raf = requestAnimationFrame(loop)
    }
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('themechange', onTheme)
    }
  }, [])

  return <canvas ref={ref} aria-hidden className={className} />
}

/* ── Loading screen ───────────────────────────────────────── */

/** Pixel disc (sun or moon) as one SVG path. */
function discPath(size: number) {
  const r = size / 2
  let d = ''
  for (let y = 0; y < size; y++) {
    const dy = y + 0.5 - r
    const half = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)))
    if (half > 0) d += `M${r - half} ${y}h${half * 2}v1h-${half * 2}z`
  }
  return d
}
const BOOT_TORII = ['x..............x', 'xxxxxxxxxxxxxxxx', '.xxxxxxxxxxxxxx.', '...xx......xx...', '.xxxxxxxxxxxxxx.', '...xx......xx...', '...xx......xx...', '...xx......xx...', '..xxxx....xxxx..']
const toriiPath = BOOT_TORII.map((row, y) => [...row].map((c, x) => (c === 'x' ? `M${x} ${y}h1v1h-1z` : '')).join('')).join('')

/** The little dusk (or dawn) scene shown while loading — drawn twice for the sliding-door exit. */
function BootArt({ pct, night, name }: { pct: number; night: boolean; name: string }) {
  const lanterns = 10
  const lit = Math.round((pct / 100) * lanterns)
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(to bottom, var(--sky-1), var(--sky-2) 55%, var(--sky-3))' }}>
      {/* sun / moon rising with the progress */}
      <div className="absolute left-1/2 top-[30%] h-40 w-40 -translate-x-1/2 sm:h-56 sm:w-56" style={{ transform: `translate(-50%, ${((100 - pct) * 1.6).toFixed(0)}px)` }}>
        <div className="absolute -inset-1/2 rounded-full" style={{ background: 'radial-gradient(closest-side, var(--glow), transparent)' }} />
        <svg viewBox="0 0 28 28" width="100%" height="100%" shapeRendering="crispEdges" className="relative">
          <path d={discPath(28)} fill={night ? 'var(--moon)' : 'var(--sun)'} />
        </svg>
      </div>

      {/* hills + torii */}
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="absolute inset-x-0 bottom-[17%] h-[26%] w-full" shapeRendering="crispEdges">
        <path d="M0 30V10h5V7h5V4h4v3h5V9h6V5h5V2h4v3h6V8h5V6h6V3h5v4h6V9h5V6h6V4h5v5h7V7h5V5H100V30z" fill="var(--mtn-1)" />
        <path d="M0 30V18h6v-3h6v-4h5v3h7v-5h6v4h8v-2h6v5h7v-3h6v-4h7v4h6v3h8v-4h6v6h3v-3H100V30z" fill="var(--mtn-2)" />
      </svg>
      <svg viewBox="0 0 16 9" width="96" height="54" shapeRendering="crispEdges" className="absolute bottom-[19%] left-1/2 -translate-x-1/2">
        <path d={toriiPath} fill="var(--mtn-3)" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-[18%]" style={{ background: 'var(--mtn-3)' }} />

      {/* title + lantern loading bar */}
      <div className="absolute inset-x-0 top-[12%] px-6 text-center">
        <p className="label text-sm text-muted">Portfolio · 2026</p>
        <p className="title-shadow mt-3 font-pixel text-lg text-ink sm:text-2xl">{name}</p>
      </div>
      <div className="absolute inset-x-0 bottom-[6%] px-6 text-center">
        <div className="mx-auto flex w-fit items-end gap-2.5 sm:gap-3.5">
          {Array.from({ length: lanterns }, (_, i) => (
            <span key={i} className={`boot-lantern ${i < lit ? 'on' : ''}`} />
          ))}
        </div>
        <p className="label mt-4 text-sm text-ink/80">
          {pct < 100 ? `Lighting the lanterns… ${String(pct).padStart(3, '0')}%` : 'Welcome'}
        </p>
        <p className="mt-1 text-xs text-ink/60">(click or press any key to skip)</p>
      </div>
    </div>
  )
}

export function BootScreen() {
  const [show, setShow] = useState(() => {
    if (reducedMotion()) return false
    try {
      return sessionStorage.getItem('booted') !== '1'
    } catch {
      return true
    }
  })
  const [pct, setPct] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const night = typeof document !== 'undefined' && document.documentElement.dataset.theme !== 'light'
  const name = 'JAZPHER NEIL P. QUIRANTE'

  useEffect(() => {
    if (!show) return
    let gone = false
    const done = () => {
      if (gone) return
      gone = true
      setLeaving(true)
      try {
        sessionStorage.setItem('booted', '1')
      } catch {
        /* ignore */
      }
      setTimeout(() => setShow(false), 800)
    }
    const id = setInterval(() => {
      setPct((p) => {
        const n = Math.min(100, p + 3 + Math.floor(Math.random() * 7))
        if (n === 100) {
          clearInterval(id)
          setTimeout(done, 500)
        }
        return n
      })
    }, 60)
    const skip = () => {
      clearInterval(id)
      setPct(100)
      done()
    }
    window.addEventListener('keydown', skip, { once: true })
    window.addEventListener('pointerdown', skip, { once: true })
    return () => {
      clearInterval(id)
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
  }, [show])

  if (!show) return null
  // Two copies of the scene, each clipped to one half, slide apart like shoji doors.
  return (
    <div className="fixed inset-0 z-[100]" aria-hidden>
      <div className={`absolute inset-0 [clip-path:inset(0_50%_0_0)] ${leaving ? 'door-left' : ''}`}>
        <BootArt pct={pct} night={night} name={name} />
      </div>
      <div className={`absolute inset-0 [clip-path:inset(0_0_0_50%)] ${leaving ? 'door-right' : ''}`}>
        <BootArt pct={pct} night={night} name={name} />
      </div>
    </div>
  )
}

/* ── Hooks ────────────────────────────────────────────────── */

/**
 * Adds `.in` to every `.reveal` element when it scrolls into view.
 * Also watches for `.reveal` elements added later (re-renders, hot reload)
 * so nothing can get stuck invisible.
 */
export function useReveal() {
  useEffect(() => {
    const showAll = () => document.querySelectorAll('.reveal:not(.in)').forEach((e) => e.classList.add('in'))
    if (reducedMotion() || !('IntersectionObserver' in window)) {
      showAll()
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        // Elements entering together pop in one after another.
        let n = 0
        for (const e of entries) {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement
            if (!el.style.transitionDelay) {
              el.style.transitionDelay = `${Math.min(n, 6) * 90}ms`
              // clear it afterwards so hover/tilt stay instant
              window.setTimeout(() => (el.style.transitionDelay = ''), 1200)
            }
            n++
            el.classList.add('in')
            io.unobserve(el)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    const observeNew = () => document.querySelectorAll('.reveal:not(.in)').forEach((e) => io.observe(e))
    observeNew()
    const mo = new MutationObserver(observeNew)
    mo.observe(document.body, { childList: true, subtree: true })
    // Print / "save as PDF" should never show blank sections.
    window.addEventListener('beforeprint', showAll)
    return () => {
      io.disconnect()
      mo.disconnect()
      window.removeEventListener('beforeprint', showAll)
    }
  }, [])
}

export function useTypewriter(text: string, speed = 28, startDelay = 0) {
  const [out, setOut] = useState(() => (reducedMotion() ? text : ''))
  useEffect(() => {
    if (reducedMotion()) return
    let i = 0
    let id: number
    const start = window.setTimeout(() => {
      id = window.setInterval(() => {
        i++
        setOut(text.slice(0, i))
        if (i >= text.length) clearInterval(id)
      }, speed)
    }, startDelay)
    return () => {
      clearTimeout(start)
      clearInterval(id)
    }
  }, [text, speed, startDelay])
  return out
}

export function useScrollProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    // Batch scroll events to one update per frame, rounded so React
    // only re-renders when the visible value actually changes.
    let queued = false
    const measure = () => {
      queued = false
      const max = document.documentElement.scrollHeight - window.innerHeight
      const v = max > 0 ? Math.min(1, window.scrollY / max) : 0
      setP(Math.round(v * 200) / 200)
    }
    const on = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
    }
  }, [])
  return p
}

export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState('')
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [ids])
  return active
}

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

export function useKonami(onUnlock: () => void) {
  const cb = useRef(onUnlock)
  cb.current = onUnlock
  useEffect(() => {
    let i = 0
    const on = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      i = k === KONAMI[i] ? i + 1 : k === KONAMI[0] ? 1 : 0
      if (i === KONAMI.length) {
        i = 0
        cb.current()
      }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])
}

/** Global score bonus (coins collected etc). */
export const addScore = (n: number) => window.dispatchEvent(new CustomEvent('score', { detail: n }))

/* ── Mouse: pixel sparkle trail + click burst ─────────────── */

/**
 * Canvas overlay that drops fading pixel "sparks" behind the pointer and
 * bursts on click. Only runs for a real mouse, and only animates while
 * there are sparks alive, so it costs nothing while idle.
 */
/**
 * Cursor trail: tiny pixel sparks that pop and shrink away in under half a
 * second. Each spark is a plain element with a CSS animation that removes
 * itself when done — nothing is ever painted onto a canvas, so nothing can
 * get "stuck" on screen.
 */
export function SparkTrail() {
  useEffect(() => {
    if (reducedMotion() || !window.matchMedia('(pointer: fine)').matches) return
    const layer = document.createElement('div')
    layer.className = 'spark-layer'
    layer.setAttribute('aria-hidden', 'true')
    document.body.appendChild(layer)

    const COLORS = ['var(--accent)', 'var(--yellow)', 'var(--pink)']
    let lastX = -999
    let lastY = -999
    let n = 0

    const spawn = (x: number, y: number, big = false) => {
      if (layer.childElementCount > 24) return
      const s = document.createElement('span')
      s.className = big ? 'spark big' : 'spark'
      s.style.left = `${Math.round(x / 2) * 2}px`
      s.style.top = `${Math.round(y / 2) * 2}px`
      s.style.background = COLORS[n++ % COLORS.length]
      s.style.setProperty('--dx', `${Math.round((Math.random() - 0.5) * 16)}px`)
      s.addEventListener('animationend', () => s.remove(), { once: true })
      layer.appendChild(s)
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      if (dx * dx + dy * dy < 22 * 22) return
      lastX = e.clientX
      lastY = e.clientY
      spawn(e.clientX, e.clientY)
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      for (let i = 0; i < 5; i++) spawn(e.clientX, e.clientY, true)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      layer.remove()
    }
  }, [])
  return null
}

/* ── Cards tilt toward the mouse ──────────────────────────── */

/** Subtle 3D tilt for elements with `.tilt`, driven by one delegated listener. */
export function useTilt() {
  useEffect(() => {
    if (reducedMotion() || !window.matchMedia('(pointer: fine)').matches) return
    let current: HTMLElement | null = null
    let raf = 0
    let mx = 0
    let my = 0
    const apply = () => {
      raf = 0
      if (!current) return
      const r = current.getBoundingClientRect()
      const px = (mx - r.left) / r.width - 0.5
      const py = (my - r.top) / r.height - 0.5
      current.style.setProperty('--rx', `${(-py * 6).toFixed(2)}deg`)
      current.style.setProperty('--ry', `${(px * 6).toFixed(2)}deg`)
      current.style.setProperty('--mx', `${((px + 0.5) * 100).toFixed(1)}%`)
      current.style.setProperty('--my', `${((py + 0.5) * 100).toFixed(1)}%`)
    }
    const reset = (el: HTMLElement) => {
      el.style.removeProperty('--rx')
      el.style.removeProperty('--ry')
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const el = (e.target as Element).closest<HTMLElement>('.tilt')
      if (el !== current) {
        if (current) reset(current)
        current = el
      }
      if (!current) return
      mx = e.clientX
      my = e.clientY
      if (!raf) raf = requestAnimationFrame(apply)
    }
    const onLeave = () => {
      if (current) reset(current)
      current = null
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])
}

/* ── Falling pixel sakura petals ───────────────────────────── */

export function Petals() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (reducedMotion()) return
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let w = 0
    let h = 0
    let raf = 0
    let last = 0
    let colors = ['#ff9eb8', '#ffc4d4']
    const readColors = () => {
      const light = document.documentElement.dataset.theme === 'light'
      colors = light ? ['#f28aa6', '#f7b3c4'] : ['#ff8fae', '#ffc0d0']
    }
    const count = window.innerWidth < 640 ? 4 : 8
    const petals = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: 2, // pixel size
      v: 0.0006 + Math.random() * 0.0008, // fall speed
      p: Math.random() * Math.PI * 2, // sway phase
      c: Math.floor(Math.random() * 2),
    }))
    const resize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const q of petals) {
        const x = Math.round((q.x * w + Math.sin(q.p) * 26) / q.s) * q.s
        const y = Math.round((q.y * h) / q.s) * q.s
        const flip = Math.sin(q.p * 1.7) > 0
        ctx.fillStyle = colors[q.c]
        // tiny 3x2 pixel petal that "flips" as it falls
        if (flip) {
          ctx.fillRect(x, y, q.s * 2, q.s)
          ctx.fillRect(x + q.s, y + q.s, q.s * 2, q.s)
        } else {
          ctx.fillRect(x + q.s, y, q.s * 2, q.s)
          ctx.fillRect(x, y + q.s, q.s * 2, q.s)
        }
      }
    }
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop)
      if (document.hidden || t - last < 33) return
      last = t
      for (const q of petals) {
        q.y += q.v
        q.p += 0.03
        q.x += 0.0002
        if (q.y > 1.02) {
          q.y = -0.02
          q.x = Math.random()
        }
        if (q.x > 1.02) q.x = -0.02
      }
      draw()
    }
    resize()
    readColors()
    window.addEventListener('resize', resize)
    window.addEventListener('themechange', readColors)
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('themechange', readColors)
    }
  }, [])
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[40]" />
}

/* ── Cursor follower ──────────────────────────────────────── */

/**
 * A pixel ring that trails the mouse with a little lag. It grows over
 * links/buttons and turns into a "VIEW" bubble over screenshots
 * (elements with data-cursor="view"). Mouse only; off for reduced motion.
 */
export function CursorFollower() {
  const ring = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reducedMotion() || !window.matchMedia('(pointer: fine)').matches) return
    const el = ring.current!
    let x = -100
    let y = -100
    let rx = -100
    let ry = -100
    let raf = 0
    let mode = ''

    const loop = () => {
      rx += (x - rx) * 0.2
      ry += (y - ry) * 0.2
      el.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
      raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.2 ? requestAnimationFrame(loop) : 0
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      x = e.clientX
      y = e.clientY
      el.style.opacity = '1'
      const t = (e.target as Element).closest('[data-cursor], a, button, summary')
      const m = t ? t.getAttribute('data-cursor') || 'link' : ''
      if (m !== mode) {
        mode = m
        el.dataset.mode = m
      }
      if (!raf) raf = requestAnimationFrame(loop)
    }
    const onLeave = () => (el.style.opacity = '0')
    const onDown = () => el.classList.add('press')
    const onUp = () => el.classList.remove('press')

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  return (
    <div ref={ring} aria-hidden className="cursor-follow" style={{ opacity: 0 }}>
      <span className="cursor-ring">
        <span className="cursor-label">View</span>
      </span>
    </div>
  )
}

/** Fades and lifts an element away as the page scrolls past it. */
export function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion()) return
    let queued = false
    const update = () => {
      queued = false
      const t = Math.min(1, window.scrollY / (window.innerHeight * 0.8))
      el.style.opacity = String(1 - t * 0.9)
      el.style.transform = `translateY(${(-t * 60).toFixed(1)}px)`
    }
    const on = () => {
      if (!queued) {
        queued = true
        requestAnimationFrame(update)
      }
    }
    update()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return ref
}

/** Scroll-progress bar that writes its transform directly (no re-renders). */
export function useScrollBar() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let queued = false
    const update = () => {
      queued = false
      const max = document.documentElement.scrollHeight - window.innerHeight
      const v = max > 0 ? Math.min(1, window.scrollY / max) : 0
      if (ref.current) ref.current.style.transform = `scaleX(${v.toFixed(4)})`
    }
    const on = () => {
      if (!queued) {
        queued = true
        requestAnimationFrame(update)
      }
    }
    update()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
    }
  }, [])
  return ref
}
