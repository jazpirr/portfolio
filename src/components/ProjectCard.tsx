import { useEffect, useRef, useState } from 'react'
import type { Project } from '../data/portfolio'
import { MediaView } from './MediaView'

type Style = React.CSSProperties & Record<`--${string}`, string>

/**
 * Compact project card. The cover fills its frame (no letterboxing);
 * "Details" opens a dialog with the full gallery and highlights.
 */
export function ProjectCard({ project: p, n, color }: { project: Project; n: number; color: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [shot, setShot] = useState(0)
  const media = p.media ?? []
  // Hovering the card flips through its screenshots like a slideshow.
  const [preview, setPreview] = useState(0)
  const timer = useRef(0)
  const cover = media[preview] ?? media[0]

  const startPreview = () => {
    if (media.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    clearInterval(timer.current)
    timer.current = window.setInterval(() => setPreview((i) => (i + 1) % media.length), 1100)
  }
  const stopPreview = () => {
    clearInterval(timer.current)
    setPreview(0)
  }
  useEffect(() => () => clearInterval(timer.current), [])

  const open = (i = 0) => {
    setShot(i)
    dialog.current?.showModal()
  }

  const hasDetails = media.length > 0 || p.highlights.length > 0

  return (
    <article
      className="card spot tilt lift-soft reveal flex min-w-0 flex-col p-4 sm:p-5"
      aria-labelledby={`p-${n}`}
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
    >
      {/* cover */}
      {cover ? (
        <button
          type="button"
          onClick={() => open(preview)}
          data-cursor="view"
          className="shine group relative block aspect-video w-full cursor-zoom-in overflow-hidden bg-surface-2 shadow-[0_0_0_2px_var(--line)]"
          aria-label={`Open ${p.title} screenshots`}
        >
          {media.length > 1 && (
            <span aria-hidden className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {media.map((m, i) => (
                <span key={m.src} className={`h-1.5 w-1.5 ${i === preview ? 'bg-accent' : 'bg-white/60'}`} />
              ))}
            </span>
          )}
          <div
            className="h-full w-full"
            style={cover.zoom ? { transform: `scale(${cover.zoom})`, transformOrigin: '50% 5%' } : undefined}
          >
            <img
              src={cover.src}
              alt={cover.alt}
              loading="lazy"
              decoding="async"
              className={`h-full w-full transition-transform duration-500 ${
                cover.portrait
                  ? 'scale-[1.65] bg-white object-contain group-hover:scale-[1.75]'
                  : 'object-cover object-top group-hover:scale-105'
              }`}
            />
          </div>
        </button>
      ) : (
        // no screenshots: a simple pixel "code" banner
        <div
          aria-hidden
          className="grid aspect-video w-full place-items-center bg-surface-2 shadow-[0_0_0_2px_var(--line)]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 11px, color-mix(in srgb, var(--line) 18%, transparent) 11px 12px)' }}
        >
          <span className="font-pixel text-2xl text-muted">{'</>'}</span>
        </div>
      )}

      <div className="mt-4 flex items-start justify-between gap-3">
        <h3 id={`p-${n}`} className="font-pixel text-[15px] leading-snug" style={{ color }}>
          {p.title}
        </h3>
        {p.kind && <span className="chip accent shrink-0">{p.kind}</span>}
      </div>
      <p className="mt-2.5 text-[15px] leading-relaxed text-ink/85">{p.description}</p>

      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tech stack">
        {p.stack.map((s) => (
          <li key={s} className="chip">
            {s}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <span className="label text-sm text-muted">
          {p.year}
        </span>
        <span className="flex items-center gap-1">
          {hasDetails && (
            <button type="button" onClick={() => open(0)} className="label px-2 py-1 text-sm hover:text-accent" aria-label={`${p.title} details`}>
              Details
            </button>
          )}
          {p.repo ? (
            <a href={p.repo} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center hover:text-accent" aria-label={`${p.title} source code on GitHub`}>
              <GitHubIcon />
            </a>
          ) : (
            <span className="label px-2 text-xs text-muted" title="Source code is private">
              Private
            </span>
          )}
        </span>
      </div>

      {hasDetails && <ProjectDialog ref={dialog} project={p} color={color} shot={shot} setShot={setShot} />}
    </article>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )

}

export function ProjectDialog({
  ref,
  project: p,
  color,
  shot,
  setShot,
}: {
  ref: React.RefObject<HTMLDialogElement | null>
  project: Project
  color: string
  shot: number
  setShot: (n: number | ((n: number) => number)) => void
}) {
  const media = p.media ?? []
  const current = media[shot]
  const go = (d: number) => setShot((i) => (i + d + media.length) % media.length)

  useEffect(() => {
    const el = ref.current
    if (!el || media.length < 2) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  })

  const close = () => ref.current?.close()

  return (
    <dialog
      ref={ref}
      aria-labelledby={`dlg-${p.title}`}
      className="m-auto max-h-[92vh] w-[min(1100px,94vw)] overflow-visible bg-transparent p-0 text-ink backdrop:bg-black/80"
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div className="px-box m-1 flex max-h-[calc(92vh-8px)] flex-col" style={{ '--sh': color } as Style}>
        <div className="flex items-center justify-between gap-3 border-b-4 border-line bg-surface-2 px-4 py-2">
          <h3 id={`dlg-${p.title}`} className="font-pixel text-sm" style={{ color }}>
            {p.title}
          </h3>
          <button type="button" onClick={close} className="label px-2 text-lg hover:text-accent" aria-label="Close">
            ✕
          </button>
        </div>

        <div className={`grid overflow-y-auto ${media.length ? 'lg:grid-cols-[1.5fr_1fr]' : ''}`}>
          {/* gallery */}
          <div className={`min-w-0 border-b-4 border-line p-4 lg:border-b-0 lg:border-r-4 ${media.length ? '' : 'hidden'}`}>
            {current && (
              <figure>
                <div className={`relative ${current.portrait ? 'px-thin bg-white' : ''}`}>
                  <MediaView
                    key={current.src}
                    media={current}
                    className={current.portrait ? 'mx-auto block h-[min(62vh,640px)] w-auto' : 'px-thin block h-auto w-full'}
                  />
                  {media.length > 1 && (
                    <>
                      <button type="button" onClick={() => go(-1)} className="px-btn px-btn-sm ghost absolute left-2 top-1/2 -translate-y-1/2" aria-label="Previous screenshot">
                        ◀
                      </button>
                      <button type="button" onClick={() => go(1)} className="px-btn px-btn-sm ghost absolute right-2 top-1/2 -translate-y-1/2" aria-label="Next screenshot">
                        ▶
                      </button>
                    </>
                  )}
                </div>
                <figcaption className="label mt-3 text-xs text-muted">
                  {current.caption} {media.length > 1 && `· ${shot + 1}/${media.length}`}
                </figcaption>
              </figure>
            )}
            {media.length > 1 && (
              <ul className="mt-3 grid grid-cols-5 gap-2" aria-label="Screenshots">
                {media.map((m, i) => (
                  <li key={m.src}>
                    <button
                      type="button"
                      onClick={() => setShot(i)}
                      aria-label={`Show ${m.caption ?? `screenshot ${i + 1}`}`}
                      aria-pressed={i === shot}
                      className={`block aspect-video w-full overflow-hidden ${m.portrait ? 'bg-white' : 'bg-surface-2'} ${
                        i === shot ? 'outline-2 outline-offset-2 outline-accent' : 'opacity-60 hover:opacity-100'
                      }`}
                      style={i === shot ? { outlineStyle: 'solid' } : undefined}
                    >
                      <MediaView media={m} decorative className={`h-full w-full ${m.portrait ? 'object-contain' : 'object-cover object-top'}`} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* details */}
          <div className="min-w-0 p-5">
            <p className="label text-xs text-muted">
              {p.context} · {p.year}
            </p>
            <p className="label mt-1 text-sm text-soft">{p.role}</p>
            <p className="mt-3 text-sm leading-relaxed">{p.description}</p>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
              {p.highlights.map((h) => (
                <li key={h} className="flex gap-2.5">
                  <span aria-hidden style={{ color }}>
                    ▸
                  </span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
            <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Tech stack">
              {p.stack.map((s) => (
                <li key={s} className="px-thin label bg-surface-2 px-1.5 text-[11px]">
                  {s}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              {p.live && (
                <a href={p.live} target="_blank" rel="noreferrer" className="px-btn px-btn-sm">
                  ▶ Live demo
                </a>
              )}
              {p.repo && (
                <a href={p.repo} target="_blank" rel="noreferrer" className="px-btn px-btn-sm ghost">
                  Source code ↗
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}
