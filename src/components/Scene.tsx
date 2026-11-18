import { useEffect, useMemo, useRef, useState } from 'react'
import { reducedMotion, Starfield } from './effects'

/**
 * Fixed pixel-art sunset behind the whole page:
 * sky gradient → stars → striped sun → drifting clouds → three mountain
 * ranges (with a torii gate and a bonsai tree). As you scroll, the sun and
 * hills sink and the sky dims toward night, so content stays readable.
 * Everything is drawn from code — no image files.
 */

const PX = 6 // size of one "pixel" in the scenery

/* ── Pixel sprites (x = silhouette) ───────────────────────── */

const TORII = [
  'xx......................xx',
  'xxxxxxxxxxxxxxxxxxxxxxxxxx',
  '.xxxxxxxxxxxxxxxxxxxxxxxx.',
  '....xx......xx......xx....',
  '..xxxxxxxxxxxxxxxxxxxxxx..',
  '....xx..............xx....',
  '....xx..............xx....',
  '....xx..............xx....',
  '....xx..............xx....',
  '....xx..............xx....',
  '....xx..............xx....',
  '....xx..............xx....',
  '....xx..............xx....',
  '....xx..............xx....',
  '...xxxx............xxxx...',
]

const BONSAI = [
  '..........xxxx......................',
  '......xxxxxxxxxx.......xxxxx........',
  '....xxxxxxxxxxxxxx...xxxxxxxxxx.....',
  '...xxxxxxxxxxxxxxxx.xxxxxxxxxxxxx...',
  '.....xxxxxxxxxxxx....xxxxxxxxxxxx...',
  '........xx..x.xx.......xxxxxxx.x....',
  '.........xx...xx........x..xx.......',
  '..........xx...xx.........xx........',
  '...........xxx..xx......xxx.........',
  'xxxxxx.......xx..xxx..xxx...........',
  'xxxxxxxxx.....xx...xxxx.............',
  '.xxxxxxxxx.....xxx.xxx..............',
  '...xxxxx.xx......xxxx...............',
  '..........xxx.....xxx...............',
  '............xxx...xxx...............',
  '..............xxxxxxx...............',
  '.................xxxx...............',
  '.................xxxx...............',
  '................xxxx................',
  '................xxxx................',
  '...............xxxx.................',
  '...............xxxxx................',
  '..............xxxxxx................',
  '.............xxxxxxxx...............',
]

const CLOUDS = [
  ['......xxxx..........', '...xxxxxxxxx...xxx..', '.xxxxxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxxxxxx'],
  ['....xxxxx.....', '..xxxxxxxxxx..', 'xxxxxxxxxxxxxx'],
  ['.........xxxx.........', '..xxxx.xxxxxxxxx..xx..', 'xxxxxxxxxxxxxxxxxxxxxx'],
]

/** Render a sprite as one SVG path (one rect run per row segment). */
function spritePath(rows: string[]) {
  let d = ''
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      if (row[x] !== 'x') {
        x++
        continue
      }
      let run = 1
      while (row[x + run] === 'x') run++
      d += `M${x} ${y}h${run}v1h-${run}z`
      x += run
    }
  })
  return d
}

function PixelSprite({ rows, fill, className, style }: { rows: string[]; fill: string; className?: string; style?: React.CSSProperties }) {
  const d = useMemo(() => spritePath(rows), [rows])
  return (
    <svg
      viewBox={`0 0 ${rows[0].length} ${rows.length}`}
      width={rows[0].length * PX}
      height={rows.length * PX}
      shapeRendering="crispEdges"
      className={className}
      style={style}
      aria-hidden
    >
      <path d={d} fill={fill} />
    </svg>
  )
}

/* ── Mountain ranges ──────────────────────────────────────── */

/** Deterministic noise so the ridges look the same on every visit. */
function ridge(cols: number, seed: number, base: number, amp: number) {
  const h: number[] = []
  for (let i = 0; i < cols; i++) {
    const t = i / cols
    const v =
      Math.sin(t * 6.3 * 1.7 + seed) * 0.5 +
      Math.sin(t * 6.3 * 3.9 + seed * 2.1) * 0.3 +
      Math.sin(t * 6.3 * 9.3 + seed * 0.7) * 0.2
    h.push(Math.max(1, Math.round(base + v * amp)))
  }
  return h
}

/** Stepped (pixel) silhouette path for a list of column heights. */
function ridgePath(heights: number[], total: number) {
  let d = `M0 ${total}`
  heights.forEach((hh, i) => {
    d += `V${total - hh}H${i + 1}`
  })
  return d + `V${total}z`
}

function Range({ cols, rows, seed, base, amp, fill }: { cols: number; rows: number; seed: number; base: number; amp: number; fill: string }) {
  const d = useMemo(() => ridgePath(ridge(cols, seed, base, amp), rows), [cols, rows, seed, base, amp])
  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      width={cols * PX}
      height={rows * PX}
      shapeRendering="crispEdges"
      className="absolute bottom-0 left-0 block"
      aria-hidden
    >
      <path d={d} fill={fill} />
    </svg>
  )
}

/* ── Sun: pixel disc with sunset stripes ──────────────────── */

function Sun({ size }: { size: number }) {
  const d = useMemo(() => {
    const r = size / 2
    let path = ''
    for (let y = 0; y < size; y++) {
      // horizontal gaps in the lower half, growing toward the bottom
      const lower = y - r
      if (lower > 1 && lower % 3 === 0 && lower / r > 0.15) continue
      const dy = y + 0.5 - r
      const half = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)))
      if (half <= 0) continue
      path += `M${r - half} ${y}h${half * 2}v1h-${half * 2}z`
    }
    return path
  }, [size])
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" shapeRendering="crispEdges" aria-hidden>
      <path d={d} fill="var(--sun)" />
    </svg>
  )
}

/* ── Moon: pale pixel disc with craters ──────────────────── */

function Moon({ size }: { size: number }) {
  const { disc, craters } = useMemo(() => {
    const r = size / 2
    let disc = ''
    for (let y = 0; y < size; y++) {
      const dy = y + 0.5 - r
      const half = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)))
      if (half > 0) disc += `M${r - half} ${y}h${half * 2}v1h-${half * 2}z`
    }
    // crater positions as fractions of the disc
    const c = [
      [0.3, 0.3, 0.14],
      [0.62, 0.22, 0.08],
      [0.58, 0.58, 0.17],
      [0.28, 0.66, 0.08],
      [0.78, 0.48, 0.06],
    ]
    let craters = ''
    for (const [cx, cy, cr] of c) {
      const R = Math.max(1, Math.round(cr * size))
      const x0 = Math.round(cx * size)
      const y0 = Math.round(cy * size)
      for (let y = -R; y < R; y++) {
        const half = Math.floor(Math.sqrt(Math.max(0, R * R - (y + 0.5) ** 2)))
        if (half > 0) craters += `M${x0 - half} ${y0 + y}h${half * 2}v1h-${half * 2}z`
      }
    }
    return { disc, craters }
  }, [size])
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" shapeRendering="crispEdges" aria-hidden>
      <path d={disc} fill="var(--moon)" />
      <path d={craters} fill="var(--moon-shade)" />
    </svg>
  )
}

/* ── Scene ────────────────────────────────────────────────── */

export function Scene() {
  const root = useRef<HTMLDivElement>(null)
  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 1366 : window.innerWidth))
  const [night, setNight] = useState(() => document.documentElement.dataset.theme !== 'light')
  const [motion, setMotion] = useState<'' | 'c-set' | 'c-rise'>('')

  // Day/Night: the toggle fires "celestial-set" first, then "themechange".
  useEffect(() => {
    let t = 0
    const onSet = () => setMotion('c-set')
    const onTheme = () => {
      setNight(document.documentElement.dataset.theme !== 'light')
      setMotion((m) => (m === 'c-set' ? 'c-rise' : ''))
      clearTimeout(t)
      t = window.setTimeout(() => setMotion(''), 1000)
    }
    window.addEventListener('celestial-set', onSet)
    window.addEventListener('themechange', onTheme)
    return () => {
      clearTimeout(t)
      window.removeEventListener('celestial-set', onSet)
      window.removeEventListener('themechange', onTheme)
    }
  }, [])

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Scroll → CSS variables, eased toward the real scroll position each frame
  // so the parallax glides instead of jumping.
  //   --s   scroll, capped (hills/sun)      --sy  raw scroll (lanterns)
  //   --p   0…1 page progress (sky tint)    --dim readability dimmer
  useEffect(() => {
    const el = root.current!
    let cur = window.scrollY
    let raf = 0
    const set = (v: number) => {
      const vh = window.innerHeight
      const max = Math.max(1, document.documentElement.scrollHeight - vh)
      // Only the few layers that move are touched — no page-wide CSS variables,
      // so the browser doesn't have to restyle the whole scene every frame.
      const sc = Math.min(v, vh * 2.5)
      const prog = Math.min(1, v / max)
      for (const l of el.querySelectorAll<HTMLElement>('[data-par]')) {
        l.style.transform = `translate3d(0, ${(sc * Number(l.dataset.par)).toFixed(1)}px, 0)`
      }
      const tintA = document.documentElement.dataset.theme === 'light' ? 0.45 : 0.7
      const tint = el.querySelector<HTMLElement>('[data-tint]')
      if (tint) tint.style.opacity = (prog * tintA).toFixed(3)
      const stars = el.querySelector<HTMLElement>('[data-stars]')
      if (stars) stars.style.opacity = (0.55 + prog * 0.45).toFixed(3)
      // the sun/moon fades as you scroll so it never sits behind text
      const sky = el.querySelector<HTMLElement>('[data-celestial]')
      if (sky) sky.style.opacity = (1 - Math.min(1, v / vh) * 0.8).toFixed(3)
      const dim = el.querySelector<HTMLElement>('[data-dim]')
      if (dim) dim.style.opacity = Math.min(0.32, (v / vh) * 0.3).toFixed(3)
    }
    const tick = () => {
      const target = window.scrollY
      cur += (target - cur) * 0.12
      if (Math.abs(target - cur) < 0.5) {
        cur = target
        raf = 0
      } else {
        raf = requestAnimationFrame(tick)
      }
      set(cur)
    }
    const on = () => {
      if (reducedMotion()) {
        cur = window.scrollY
        set(cur)
        return
      }
      if (!raf) raf = requestAnimationFrame(tick)
    }
    set(cur)
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    const onTheme = () => set(cur)
    window.addEventListener('themechange', onTheme)
    return () => {
      window.removeEventListener('themechange', onTheme)
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
    }
  }, [])

  const cols = Math.ceil(vw / PX) + 1
  const small = vw < 640
  const sunPx = small ? 20 : 34 // sun/moon diameter in scenery pixels

  return (
    <div ref={root} aria-hidden className="scene pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, var(--sky-1) 0%, var(--sky-2) 45%, var(--sky-3) 80%)' }} />
      {/* the sky deepens toward night (or warms toward sunset) as you scroll */}
      <div
        className="absolute inset-0"
        data-tint
        style={{ background: 'linear-gradient(to bottom, var(--tint-1), var(--tint-2))', opacity: 0 }}
      />
      {/* stars get brighter the further down you go */}
      <div data-stars className="absolute inset-0" style={{ opacity: 0.55 }}>
        <Starfield className="absolute inset-0" />
      </div>

      {/* sun (day) / moon (night) + glow — barely moves, like it's far away */}
      <div
        className={`absolute ${motion ? 'celestial-switching' : ''}`}
        style={{
          width: sunPx * PX,
          height: sunPx * PX,
          left: small ? '64%' : '68%',
          top: small ? '10%' : '13%',
        }}
        data-par="0.05"
        data-celestial
      >
        <div className={`absolute inset-0 ${motion}`}>
          <div className="glow-pulse absolute -inset-1/2 rounded-full" style={{ background: 'radial-gradient(closest-side, var(--glow), transparent)' }} />
          {night ? <Moon size={sunPx} /> : <Sun size={sunPx} />}
        </div>
      </div>

      {/* drifting clouds */}
      <div data-par="0.1" className="absolute inset-0 will-change-transform">
        <PixelSprite rows={CLOUDS[0]} fill="var(--cloud)" className="cloud absolute top-[14%]" style={{ animationDuration: '160s', animationDelay: '-40s' }} />
        <PixelSprite rows={CLOUDS[1]} fill="var(--cloud)" className="cloud absolute top-[30%]" style={{ animationDuration: '120s', animationDelay: '-95s' }} />
        <PixelSprite rows={CLOUDS[2]} fill="var(--cloud)" className="cloud absolute top-[8%]" style={{ animationDuration: '200s', animationDelay: '-150s' }} />
        <PixelSprite rows={CLOUDS[1]} fill="var(--cloud)" className="cloud absolute top-[40%] hidden sm:block" style={{ animationDuration: '140s', animationDelay: '-20s' }} />
      </div>

      {/* mountain ranges, far → near, with mist between them (parallax) */}
      <div data-par="0.06" className="absolute inset-x-0 bottom-0 h-full will-change-transform">
        <Range cols={cols} rows={56} seed={1.3} base={30} amp={14} fill="var(--mtn-1)" />
      </div>

      {/* a few lanterns (night) / birds (day); they leave and return with the moon and sun */}
      <div className={`absolute inset-0 ${motion === 'c-set' ? (night ? 'lanterns-out' : 'birds-out') : motion === 'c-rise' ? (night ? 'lanterns-in' : 'birds-in') : ''}`}>
        <Flyers night={night} small={small} />
      </div>

      <div data-par="0.13" className="absolute inset-x-0 bottom-0 h-full will-change-transform">
        <Range cols={cols} rows={40} seed={4.1} base={18} amp={9} fill="var(--mtn-2)" />
        <PixelSprite rows={TORII} fill="var(--mtn-2)" className="absolute" style={{ left: small ? '6%' : '46%', bottom: 9 * PX }} />
      </div>


      <div data-par="0.22" className="absolute inset-x-0 bottom-0 h-full will-change-transform">
        <Range cols={cols} rows={24} seed={7.7} base={9} amp={5} fill="var(--mtn-3)" />
        <PixelSprite rows={BONSAI} fill="var(--mtn-3)" className="absolute" style={{ right: small ? '-4%' : '6%', bottom: 4 * PX }} />
      </div>

      {/* readability dimmer */}
      <div data-dim className="absolute inset-0 bg-bg" style={{ opacity: 0 }} />
    </div>
  )
}

/* ── Ambient flyers: a few lanterns at night, a few birds by day ─────────
   Kept deliberately small and sparse so they read as background detail.
   They run on the browser's animation engine (off the main thread). */

const LANTERN = ['..kkk..', '.kkkkk.', 'krrrrrk', 'krooork', 'kroyork', 'krooork', 'krrrrrk', '.kkkkk.', '...k...', '...y...']
const LANTERN_COLORS: Record<string, string> = { k: '#4a1418', r: '#d93a26', o: '#ff8a3d', y: '#ffd27a' }
const BIRD_UP = ['xx.....xx', '..x...x..', '...xxx...', '....x....']
const BIRD_DOWN = ['....x....', '...xxx...', '..x...x..', '.x.....x.']

/** Deterministic pseudo-random so things sit in the same places every visit. */
const rand = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function MultiSprite({ rows, colors, scale }: { rows: string[]; colors: Record<string, string>; scale: number }) {
  const paths = useMemo(() => {
    const out: Record<string, string> = {}
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = row[x]
        if (c !== '.') out[c] = (out[c] ?? '') + `M${x} ${y}h1v1h-1z`
      }
    })
    return out
  }, [rows])
  return (
    <svg viewBox={`0 0 ${rows[0].length} ${rows.length}`} width={rows[0].length * scale} height={rows.length * scale} shapeRendering="crispEdges" aria-hidden>
      {Object.entries(paths).map(([c, d]) => (
        <path key={c} d={d} fill={colors[c]} />
      ))}
    </svg>
  )
}

function Flyers({ night, small }: { night: boolean; small: boolean }) {
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const count = small ? 2 : 3
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: 8 + rand(i + 21) * 80,
        top: 0.12 + rand(i + 321) * 0.3,
        depth: rand(i + 1),
        start: rand(i + 41),
      })),
    [count],
  )

  useEffect(() => {
    if (reducedMotion()) return
    const anims: Animation[] = []
    const h = window.innerHeight
    const w = window.innerWidth
    items.forEach((it, i) => {
      const el = refs.current[i]
      if (!el) return
      // lanterns rise slowly; birds glide left → right
      const frames = night
        ? [{ transform: `translate3d(0, ${h + 40}px, 0)` }, { transform: 'translate3d(0, -120px, 0)' }]
        : [{ transform: 'translate3d(-80px, 0, 0)' }, { transform: `translate3d(${w + 60}px, 0, 0)` }]
      const speed = night ? 10 + it.depth * 10 : 22 + it.depth * 22 // px per second
      const distance = night ? h + 160 : w + 140
      const duration = (distance / speed) * 1000
      const a = el.animate(frames, { duration, iterations: Infinity, easing: 'linear' })
      a.currentTime = duration * it.start
      anims.push(a)
    })
    return () => anims.forEach((a) => a.cancel())
  }, [items, night])

  return (
    <div className="absolute inset-0">
      {items.map((it, i) => (
        <div
          key={`${night}-${i}`}
          ref={(el) => {
            refs.current[i] = el
          }}
          className="absolute will-change-transform"
          style={night ? { left: `${it.left}%`, top: 0, opacity: 0.35 + it.depth * 0.3 } : { left: 0, top: `${it.top * 100}%`, opacity: 0.4 + it.depth * 0.3 }}
        >
          {night ? (
            <div className="lantern" style={{ animationDuration: `${4 + it.depth * 2}s` }}>
              <span className="lantern-glow" />
              <MultiSprite rows={LANTERN} colors={LANTERN_COLORS} scale={Math.round(2 + it.depth * 2)} />
            </div>
          ) : (
            <span className="bird bird-bob" style={{ '--flap-d': `${0.4 + it.depth * 0.2}s`, animationDuration: '3s' } as React.CSSProperties}>
              <PixelSprite rows={BIRD_UP} fill="var(--mtn-3)" className="bird-up block" style={{ width: 9 * (2 + Math.round(it.depth * 2)), height: 4 * (2 + Math.round(it.depth * 2)) }} />
              <PixelSprite
                rows={BIRD_DOWN}
                fill="var(--mtn-3)"
                className="bird-down absolute left-0 top-0 block"
                style={{ width: 9 * (2 + Math.round(it.depth * 2)), height: 4 * (2 + Math.round(it.depth * 2)) }}
              />
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
