import { useEffect, useRef, useState } from 'react'
import type { Project } from '../data/portfolio'

type Style = React.CSSProperties & Record<`--${string}`, string>

/**
 * Compact project card. The cover fills its frame (no letterboxing);
 * "Details" opens a dialog with the full gallery and highlights.
 */
export function ProjectCard({ project: p, n, color }: { project: Project; n: number; color: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [shot, setShot] = useState(0)
  const media = p.media ?? []
  const cover = media[0]

  const open = (i = 0) => {
    setShot(i)
    dialog.current?.showModal()
  }

  return (
    <article className="px-box lift reveal tilt flex min-w-0 flex-col" style={{ '--sh': color } as Style} aria-labelledby={`p-${n}`}>
      <div className="label flex items-center justify-between border-b-4 border-line bg-surface-2 px-3 py-1.5 text-xs">
        <span>
          <span style={{ color }}>■</span> Stage 1-{n}
        </span>
        <span className="text-muted">{p.year}</span>
      </div>

      {!cover && (
        <div
          className="relative grid aspect-video w-full place-items-center overflow-hidden border-b-4 border-line bg-surface-2"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent 0 10px, rgba(255,255,255,.04) 10px 20px)' }}
        >
          <div className="text-center">
            <p className="font-pixel text-lg title-shadow" style={{ color }}>
              {p.title}
            </p>
            <p className="label mt-2 text-xs text-muted">
              Screenshots loading<span className="blink">_</span>
            </p>
          </div>
        </div>
      )}

      {cover && (
        <button
          type="button"
          onClick={() => open(0)}
          className="group relative block aspect-video w-full cursor-zoom-in overflow-hidden border-b-4 border-line bg-surface-2"
          aria-label={`Open ${p.title} screenshots`}
        >
          <div
            className="h-full w-full"
            style={cover.zoom ? { transform: `scale(${cover.zoom})`, transformOrigin: '50% 5%' } : undefined}
          >
            <img
              src={cover.src}
              alt={cover.alt}
              loading="lazy"
              decoding="async"
              className={`h-full w-full transition-transform duration-300 ${
                cover.portrait
                  ? 'scale-[1.65] bg-white object-contain group-hover:scale-[1.75]'
                  : 'object-cover object-top group-hover:scale-105'
              }`}
            />
          </div>
          {media.length > 1 && (
            <span className="label absolute bottom-2 right-2 bg-bg/85 px-2 py-0.5 text-xs text-ink">
              ▣ {media.length} shots
            </span>
          )}
        </button>
      )}

      <div className="flex flex-1 flex-col p-4">
        <p className="label text-xs text-muted">{p.context}</p>
        <h3 id={`p-${n}`} className="mt-1.5 font-pixel text-base" style={{ color }}>
          {p.title}
        </h3>
        <p className="label mt-1 text-xs text-soft">{p.role}</p>
        <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed">{p.description}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tech stack">
          {p.stack.slice(0, 2).map((s) => (
            <li key={s} className="px-thin label bg-surface-2 px-1.5 text-[11px]">
              {s}
            </li>
          ))}
          {p.stack.length > 2 && (
            <li className="label px-1 text-[11px] text-muted" title={p.stack.slice(2).join(', ')}>
              +{p.stack.length - 2}
            </li>
          )}
        </ul>
        <div className="mt-auto flex flex-wrap gap-1 pt-4">
          <button type="button" onClick={() => open(0)} className="px-btn px-btn-sm">
            ▶ Details
          </button>
          {p.repo ? (
            <a href={p.repo} target="_blank" rel="noreferrer" className="px-btn px-btn-sm ghost">
              Source ↗<span className="sr-only"> for {p.title}</span>
            </a>
          ) : (
            <span className="px-thin label m-1 self-center bg-surface-2 px-2 py-1 text-[11px] text-muted">Repo private</span>
          )}
        </div>
      </div>

      <ProjectDialog ref={dialog} project={p} color={color} shot={shot} setShot={setShot} />
    </article>
  )
}

function ProjectDialog({
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
                  <img
                    key={current.src}
                    src={current.src}
                    alt={current.alt}
                    className={current.portrait ? 'mx-auto block h-[min(62vh,640px)] w-auto' : 'px-thin block h-auto w-full'}
                    style={current.animated ? { imageRendering: 'auto' } : undefined}
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
                      <img src={m.src} alt="" loading="lazy" className={`h-full w-full ${m.portrait ? 'object-contain' : 'object-cover object-top'}`} />
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
