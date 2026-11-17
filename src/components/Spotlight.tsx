import { useEffect, useRef, useState } from 'react'
import type { Project } from '../data/portfolio'
import { MediaView } from './MediaView'
import { ProjectDialog } from './ProjectCard'

const COLORS = ['var(--yellow)', 'var(--pink)', 'var(--ok)', 'var(--orange)', 'var(--purple)']
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Projects as alternating "spotlight" rows: a pixel app-window with the
 * screenshots on one side, the story on the other. Rows slide in from
 * their side, the window drifts a little as you scroll (parallax), and
 * hovering the window flips through the screenshots.
 */
export function Spotlights({ projects }: { projects: Project[] }) {
  const frames = useRef<(HTMLDivElement | null)[]>([])

  // one scroll listener drives the parallax for every row
  useEffect(() => {
    if (reduced()) return
    let queued = false
    const update = () => {
      queued = false
      const vh = window.innerHeight
      // read all positions first (measured on the un-transformed wrapper), then write
      const els = frames.current.filter(Boolean) as HTMLDivElement[]
      const rects = els.map((el) => (el.parentElement ?? el).getBoundingClientRect())
      els.forEach((el, i) => {
        const r = rects[i]
        if (r.bottom < -200 || r.top > vh + 200) return
        const offset = (r.top + r.height / 2 - vh / 2) / vh // -1 … 1 around the centre
        el.style.transform = `translate3d(0, ${(offset * -28).toFixed(1)}px, 0)`
      })
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

  return (
    <div className="mx-auto max-w-6xl space-y-28 sm:space-y-36">
      {projects.map((p, i) => (
        <Row
          key={p.title}
          project={p}
          index={i}
          flip={i % 2 === 1}
          color={COLORS[i % COLORS.length]}
          frameRef={(el) => {
            frames.current[i] = el
          }}
        />
      ))}
    </div>
  )
}

function Row({
  project: p,
  index,
  flip,
  color,
  frameRef,
}: {
  project: Project
  index: number
  flip: boolean
  color: string
  frameRef: (el: HTMLDivElement | null) => void
}) {
  const media = p.media ?? []
  const [shot, setShot] = useState(0)
  const dialog = useRef<HTMLDialogElement>(null)
  // The display image is always the first one (the GIF for SticTactics/ClassCraft).
  const current = media[0]

  const openDetails = () => {
    setShot(0)
    dialog.current?.showModal()
  }

  return (
    <article className="grid items-center gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14" aria-labelledby={`sp-${index}`}>
      {/* screenshot window */}
      <div className={`reveal ${flip ? 'from-right lg:order-2' : 'from-left'}`}>
        <div ref={frameRef} className="will-change-transform">
          <div className="app-window" style={{ '--c': color } as React.CSSProperties}>
            <div className="app-bar">
              <span className="flex gap-1.5" aria-hidden>
                <span className="h-2.5 w-2.5 bg-pink" />
                <span className="h-2.5 w-2.5 bg-yellow" />
                <span className="h-2.5 w-2.5 bg-ok" />
              </span>
              <span className="label truncate text-xs text-muted">{p.title.toLowerCase()}.exe</span>
              <span className="label text-xs text-muted">{media.length > 1 ? `${media.length} shots` : ''}</span>
            </div>
            <button
              type="button"
              onClick={openDetails}
              className="zoom-card shine group relative block aspect-[16/10] w-full cursor-zoom-in overflow-hidden bg-surface-2"
              aria-label={`Open ${p.title} screenshots`}
            >
              <span className="zoom-img absolute inset-0 block">
                {current?.portrait && (
                  <MediaView media={current} decorative className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-md" />
                )}
                {current && (
                  <MediaView
                    media={current}
                    className={`relative h-full w-full ${current.portrait ? 'object-contain' : 'object-cover object-top'}`}
                    style={current.zoom ? { transform: `scale(${current.zoom})`, transformOrigin: '50% 5%' } : undefined}
                  />
                )}
                {!current && (
                  // no screenshots yet: a pixel title card
                  <span
                    className="grid h-full w-full place-items-center text-center"
                    style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 11px, color-mix(in srgb, var(--line) 15%, transparent) 11px 12px)' }}
                  >
                    <span>
                      <span className="title-shadow block font-pixel text-2xl sm:text-3xl" style={{ color }}>
                        {p.title}
                      </span>
                      <span className="label mt-3 block text-sm text-muted">{p.tagline}</span>
                    </span>
                  </span>
                )}
              </span>
              {/* hover overlay */}
              <span className="zoom-overlay">
                <span className="label px-thin bg-accent px-3 py-1.5 text-base text-on-accent">
                  ▶ {media.length > 1 ? `View ${media.length} screenshots` : media.length ? 'View screenshot' : 'View details'}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* story */}
      <div className={`reveal ${flip ? 'from-left lg:order-1' : 'from-right'}`}>
        <div className="flex items-baseline gap-4">
          <span aria-hidden className="outline-num font-pixel text-5xl leading-none sm:text-6xl" style={{ '--c': color } as React.CSSProperties}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="label text-sm text-muted">
            {p.context} · {p.year}
          </span>
        </div>
        <h3 id={`sp-${index}`} className="mt-5 font-pixel text-xl leading-snug sm:text-2xl" style={{ color }}>
          {p.title}
        </h3>
        <p className="label mt-2 text-base text-soft">
          {p.role}
          {p.kind && <span className="text-muted"> · {p.kind}</span>}
        </p>
        <p className="mt-4 text-[17px] leading-relaxed">{p.description}</p>
        <ul className="mt-4 space-y-1.5 text-[15px] leading-relaxed text-ink/85">
          {p.highlights.slice(0, 3).map((h) => (
            <li key={h} className="flex gap-2.5">
              <span aria-hidden style={{ color }}>
                ▸
              </span>
              {h}
            </li>
          ))}
        </ul>
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tech stack">
          {p.stack.map((s) => (
            <li key={s} className="chip">
              {s}
            </li>
          ))}
        </ul>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button type="button" onClick={openDetails} className="px-btn px-btn-sm">
            ▶ Details
          </button>
          {p.repo ? (
            <a href={p.repo} target="_blank" rel="noreferrer" className="px-btn px-btn-sm ghost">
              Source ↗
            </a>
          ) : (
            <span className="label px-2 text-sm text-muted">Repo private</span>
          )}
        </div>
      </div>

      <ProjectDialog ref={dialog} project={p} color={color} shot={shot} setShot={setShot} />
    </article>
  )
}
