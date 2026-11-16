import { useEffect, useRef, useState } from 'react'

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ── Pixel starfield background ───────────────────────────── */

export function Starfield() {
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

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10" />
}

/* ── Boot screen ──────────────────────────────────────────── */

export function BootScreen({ name }: { name: string }) {
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

  useEffect(() => {
    if (!show) return
    const done = () => {
      setLeaving(true)
      try {
        sessionStorage.setItem('booted', '1')
      } catch {
        /* ignore */
      }
      setTimeout(() => setShow(false), 450)
    }
    const id = setInterval(() => {
      setPct((p) => {
        const n = Math.min(100, p + 4 + Math.floor(Math.random() * 9))
        if (n === 100) {
          clearInterval(id)
          setTimeout(done, 650)
        }
        return n
      })
    }, 55)
    const skip = () => {
      clearInterval(id)
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
  const blocks = 20
  const filled = Math.round((pct / 100) * blocks)
  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-bg px-6 text-center ${leaving ? 'boot-out' : ''}`}
      aria-hidden
    >
      <div>
        <p className="label text-muted">© 2026 {name} soft</p>
        <p className="title-shadow mt-6 font-pixel text-2xl text-accent sm:text-4xl">PORTFOLIO</p>
        <div className="mx-auto mt-10 flex w-fit gap-1">
          {Array.from({ length: blocks }, (_, i) => (
            <span key={i} className={`h-4 w-2.5 sm:w-3.5 ${i < filled ? 'bg-accent' : 'bg-surface-2'}`} />
          ))}
        </div>
        <p className="label mt-4 text-muted">Loading… {String(pct).padStart(3, '0')}%</p>
        <p className={`label mt-10 text-lg text-ink ${pct === 100 ? 'blink' : 'opacity-0'}`}>Press start</p>
        <p className="mt-6 text-sm text-muted">(press any key to skip)</p>
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
export function PixelTrail() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (reducedMotion() || !window.matchMedia('(pointer: fine)').matches) return
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    const VARS = ['--accent', '--yellow', '--pink', '--ok', '--purple', '--orange']
    let colors: string[] = []
    const readColors = () => {
      const cs = getComputedStyle(document.documentElement)
      colors = VARS.map((v) => cs.getPropertyValue(v).trim())
    }
    type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; c: string }
    const sparks: Spark[] = []
    let raf = 0
    let lastX = -1
    let lastY = -1
    let dpr = 1

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
    }
    const add = (x: number, y: number, vx: number, vy: number, life: number, size: number) => {
      if (sparks.length > 120) sparks.shift()
      sparks.push({ x, y, vx, vy, life, max: life, size, c: colors[Math.floor(Math.random() * colors.length)] })
      if (!raf) raf = requestAnimationFrame(loop)
    }
    const loop = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.life--
        if (s.life <= 0) {
          sparks.splice(i, 1)
          continue
        }
        s.x += s.vx
        s.y += s.vy
        s.vy += 0.12
        ctx.globalAlpha = s.life / s.max
        ctx.fillStyle = s.c
        // snap to a 2px grid so sparks stay crisp "pixels"
        ctx.fillRect(Math.round(s.x / 2) * 2, Math.round(s.y / 2) * 2, s.size, s.size)
      }
      ctx.globalAlpha = 1
      raf = sparks.length ? requestAnimationFrame(loop) : 0
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      if (dx * dx + dy * dy < 140) return // one spark every ~12px of travel
      lastX = e.clientX
      lastY = e.clientY
      add(e.clientX, e.clientY, (Math.random() - 0.5) * 1.2, Math.random() * -0.6, 26, Math.random() < 0.3 ? 6 : 4)
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2
        const v = 2.5 + Math.random() * 2
        add(e.clientX, e.clientY, Math.cos(a) * v, Math.sin(a) * v - 1.5, 30 + Math.random() * 12, 4)
      }
    }

    resize()
    readColors()
    window.addEventListener('resize', resize)
    window.addEventListener('themechange', readColors)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('themechange', readColors)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [])

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[95] h-full w-full" />
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
