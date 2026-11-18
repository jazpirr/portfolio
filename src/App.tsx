import { useCallback, useEffect, useRef, useState } from 'react'
import { Spotlights } from './components/Spotlight'
import { Scene } from './components/Scene'
import { Sprite, sprites } from './components/Sprite'
import {
  addScore,
  reducedMotion,
  useActiveSection,
  useKonami,
  useReveal,
  useScrollFade,
  useScrollBar,
} from './components/effects'
import { blip, setSfx, startMusic, stopMusic } from './components/chiptune'
import { certifications, education, featured, others, profile, skills } from './data/portfolio'
import type { Certification } from './data/portfolio'

const NAV = [
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]
const NAV_IDS = NAV.map((n) => n.id)

export default function App() {
  useReveal()
  const [toast, setToast] = useState<string | null>(null)
  const [rain, setRain] = useState(0)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2800)
  }, [])

  // hidden easter egg: ↑ ↑ ↓ ↓ ← → ← → B A
  useKonami(() => {
    addScore(30000)
    setRain((r) => r + 1)
    showToast('Cheat code accepted')
  })

  return (
    <>
      <Scene />
      <a
        href="#projects"
        className="label sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:bg-accent focus:px-3 focus:py-2 focus:text-on-accent"
      >
        Skip to projects
      </a>
      <Header />
      <main className="mx-auto max-w-6xl px-4 sm:px-8">
        <Hero />
        <Projects />
        <Skills />
        <About />
        <Contact />
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-line/40 pt-6">
          <p className="text-sm text-muted">© {new Date().getFullYear()} {profile.name}</p>
          <a href="#top" className="label text-sm text-muted hover:text-accent">
            Back to top ↑
          </a>
        </div>
      </footer>
      {toast && <Toast msg={toast} />}
      {rain > 0 && <CoinRain key={rain} />}
    </>
  )
}

/* ───────────────────────── Header ───────────────────────── */

function Header() {
  const bar = useScrollBar()
  const active = useActiveSection(NAV_IDS)
  const [open, setOpen] = useState(false)

  return (
    <header className="glass sticky top-0 z-50 border-b-2 border-line/40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
        <a href="#top" className="font-pixel text-xs text-ink lg:text-sm" aria-label="Back to top">
          <span className="sm:hidden">{profile.shortName}</span>
          <span className="hidden sm:inline">{profile.name}</span>
        </a>

        <div className="flex items-center gap-6">
          <nav aria-label="Sections" className="hidden md:block">
            <ul className="label flex gap-6 text-base">
              {NAV.map((n) => (
                <li key={n.id}>
                  <a
                    href={`#${n.id}`}
                    aria-current={active === n.id ? 'true' : undefined}
                    className={`hover:text-accent ${active === n.id ? 'text-accent' : 'text-ink'}`}
                  >
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2.5">
            <SoundToggle />
            <ThemeToggle />
            <button
              type="button"
              className="px-thin label grid h-8 w-8 place-items-center md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label="Menu"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? '✕' : '≡'}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Sections" className="border-t-2 border-line/40 md:hidden">
          <ul className="label px-4 py-2 text-base">
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} onClick={() => setOpen(false)} className="block py-3">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* scroll progress */}
      <div className="absolute inset-x-0 -bottom-0.5 h-0.5" aria-hidden>
        <div ref={bar} className="h-full origin-left bg-accent will-change-transform" style={{ transform: 'scaleX(0)' }} />
      </div>
    </header>
  )
}

/**
 * 8-bit music + click blips. On by default (remembered); browsers only
 * allow audio after a user gesture, so it starts on the first click/key.
 */
function SoundToggle() {
  const [on, setOn] = useState(() => {
    try {
      return localStorage.getItem('sound') === 'on'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('sound', on ? 'on' : 'off')
    } catch {
      /* ignore */
    }
    setSfx(on)
    if (!on) {
      stopMusic()
      return
    }
    let started = false
    const start = () => {
      if (started) return
      started = true
      startMusic()
    }
    if (navigator.userActivation?.hasBeenActive) start()
    window.addEventListener('pointerdown', start, { once: true })
    window.addEventListener('keydown', start, { once: true })
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element).closest('a, button')
      if (el && !el.hasAttribute('data-no-blip')) blip(el.classList.contains('px-btn'))
    }
    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('pointerdown', start)
      window.removeEventListener('keydown', start)
      document.removeEventListener('click', onClick)
    }
  }, [on])

  return (
    <button
      type="button"
      data-no-blip
      onClick={() => setOn((o) => !o)}
      aria-pressed={on}
      aria-label={on ? 'Turn music off' : 'Turn music on'}
      title={on ? 'Music on' : 'Music off'}
      className={`px-thin label grid h-8 w-8 place-items-center text-sm ${on ? 'text-accent' : 'text-muted'}`}
    >
      {on ? (
        <span aria-hidden className="flex h-3 items-end gap-px">
          <span className="eq h-full w-[3px] bg-current" />
          <span className="eq h-full w-[3px] bg-current [animation-delay:-.3s]" />
          <span className="eq h-full w-[3px] bg-current [animation-delay:-.6s]" />
        </span>
      ) : (
        <span aria-hidden>♪</span>
      )}
    </button>
  )
}

/**
 * Night/Day switch. The moon (or sun) sinks behind the hills,
 * the palette flips while it's hidden, then the other one rises.
 */
function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme ?? 'dark')
  const [busy, setBusy] = useState(false)
  const next = theme === 'dark' ? 'light' : 'dark'

  const apply = () => {
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event('themechange'))
    setTheme(next)
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        if (reducedMotion()) {
          apply()
          return
        }
        setBusy(true)
        window.dispatchEvent(new Event('celestial-set'))
        window.setTimeout(() => {
          apply()
          window.setTimeout(() => setBusy(false), 700)
        }, 620)
      }}
      aria-label={`Switch to ${next === 'light' ? 'day' : 'night'} mode`}
      className="px-thin label relative flex h-8 items-center text-sm"
    >
      {/* sliding highlight: moves to the new side the moment you click */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-8 bg-accent transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(${(busy ? next : theme) === 'light' ? '100%' : '0'})` }}
      />
      {(['dark', 'light'] as const).map((t) => {
        const on = (busy ? next : theme) === t
        return (
          <span
            key={t}
            aria-hidden
            className={`relative grid h-full w-8 place-items-center transition-colors duration-500 ${on ? 'text-on-accent' : 'text-muted'}`}
          >
            {t === 'dark' ? '☾' : '☀'}
          </span>
        )
      })}
    </button>
  )
}

/* ───────────────────────── Sections ───────────────────────── */

function Title({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={`${id}-title`} className="reveal mb-10 text-center font-pixel text-xl sm:text-2xl">
      {children}
      <span aria-hidden className="mx-auto mt-4 block h-1 w-12 bg-accent" />
    </h2>
  )
}

function Hero() {
  const fade = useScrollFade<HTMLDivElement>()
  return (
    <section id="top" className="flex min-h-[calc(100svh-4rem)] flex-col justify-center pb-24 pt-10">
      <div ref={fade} className="max-w-3xl">
        <p className="label flex items-center gap-2.5 text-base text-ok">
          <span className="blink inline-block h-2.5 w-2.5 bg-ok" aria-hidden />
          {profile.status}
        </p>
        <p className="label mt-8 text-xl text-muted">Hi, I'm</p>
        <h1 className="title-shadow mt-3 font-pixel text-[clamp(1.3rem,4.6vw,3rem)] leading-[1.3]">
          <span className="whitespace-nowrap">Jazpher Neil P.</span>
          <br />
          <span className="text-accent">Quirante</span>
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink/90">
          I'm a 4th-year IT student at CIT‑U who builds functional, user-focused applications — from full-stack web
          platforms to Android apps and games.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a href="#projects" className="px-btn">
            View Projects
          </a>
          {profile.links.resume ? (
            <a href={profile.links.resume} target="_blank" rel="noreferrer" className="px-btn ghost">
              Download Résumé
            </a>
          ) : (
            <a href="#contact" className="px-btn ghost">
              Contact Me
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

function Projects() {
  return (
    <section id="projects" aria-labelledby="projects-title" className="pb-32 pt-8">
      <Title id="projects">Projects</Title>
      <Spotlights projects={featured} />
    </section>
  )
}

// Skills I've actually used in the projects above are highlighted.
const USED = new Set(
  [...featured, ...others]
    .flatMap((p) => p.stack)
    .map((s) => (s === 'JS' ? 'JavaScript' : s))
    .concat(['REST APIs', 'JWT / OAuth', 'Git', 'GitHub', 'HTML', 'CSS']),
)

function Skills() {
  return (
    <section id="skills" aria-labelledby="skills-title" className="pb-24">
      <Title id="skills">Skills</Title>
      <div className="card reveal mx-auto max-w-5xl p-6 sm:p-10">
        <p className="label mb-8 flex flex-wrap justify-center gap-6 text-sm text-muted">
          <span className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 bg-ok" /> Used in my projects
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 shadow-[inset_0_0_0_2px_var(--muted)]" /> Familiar
          </span>
        </p>
        <div className="divide-y-2 divide-line/20">
          {skills.map((g, gi) => (
            <div key={g.group} className="grid gap-3 py-5 first:pt-0 last:pb-0 sm:grid-cols-[9rem_1fr] sm:items-center">
              <h3 className="label text-lg text-ink">{g.group}</h3>
              <ul className="flex flex-wrap gap-2.5">
                {g.items.map((s, i) => (
                  <li key={s} style={{ '--i': String(i + gi * 3) } as React.CSSProperties} className={`chip chip-pop ${USED.has(s) ? 'solid' : 'muted'}`}>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function About() {
  const { email, linkedin, github } = profile.links
  return (
    <section id="about" aria-labelledby="about-title" className="pb-24">
      <Title id="about">About Me</Title>

      <div className="card reveal mx-auto grid max-w-5xl gap-8 p-6 sm:p-10 md:grid-cols-[11rem_1fr]">
        <div className="flex flex-col items-center gap-4 text-center">
          {/* pixel monogram in place of a photo */}
          <div className="grid h-36 w-36 place-items-center bg-surface-2 shadow-[inset_0_0_0_4px_var(--line)]">
            <span className="title-shadow font-pixel text-4xl text-accent">JQ</span>
          </div>
          <div className="label flex gap-4 text-sm">
            {email && (
              <a href={`mailto:${email}`} className="hover:text-accent">
                Email
              </a>
            )}
            {linkedin && (
              <a href={linkedin} target="_blank" rel="noreferrer" className="hover:text-accent">
                LinkedIn
              </a>
            )}
            <a href={github} target="_blank" rel="noreferrer" className="hover:text-accent">
              GitHub
            </a>
          </div>
        </div>
        <div className="space-y-5 text-[17px] leading-relaxed">
          {profile.about.map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
          <dl className="label grid grid-cols-2 gap-x-6 gap-y-2 pt-2 text-sm">
            {[
              ['Based in', profile.location],
              ['Seeking', 'OJT / internship'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted">{k}</dt>
                <dd className="text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <Education />
      <div className="mx-auto mt-8 max-w-5xl">
        <Certifications />
      </div>
    </section>
  )
}

/** College only: a degree card with the key facts, plus coursework and what's next. */
function Education() {
  const college = education[0]
  const facts: [string, string][] = [
    ['School', college.school],
    ['Standing', 'Fourth-year student'],
    ['Academic years', college.years],
    ['Expected graduation', college.years.split('–').pop()!.trim()],
    ['OJT', 'Looking for an OJT / internship placement'],
  ]
  // taken from the courses my projects were built for
  const coursework = [
    'Object-oriented programming (Java)',
    'Web development & information management',
    'Application development & systems integration',
    'Mobile app development (Android)',
    'Capstone project',
  ]
  const next = ['OJT / internship', 'Junior software developer roles', 'Full-stack web & mobile development']

  return (
    <div className="mx-auto mt-8 grid max-w-5xl gap-8 lg:grid-cols-[1.15fr_1fr]">
      <div className="card reveal p-6 sm:p-8">
        <p className="label text-sm text-ok">Education · Degree</p>
        <h3 className="mt-3 font-pixel text-base leading-relaxed sm:text-lg">
          Bachelor of Science in
          <br />
          Information Technology
        </h3>
        <dl className="mt-6 space-y-4 border-t-2 border-line/30 pt-6">
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt className="label text-xs tracking-[0.12em] text-muted">{k}</dt>
              <dd className="mt-0.5 text-[15px]">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid gap-8">
        <div className="card reveal p-6 sm:p-8">
          <p className="label text-sm tracking-[0.12em] text-muted">Coursework</p>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            {coursework.map((c) => (
              <li key={c} className="flex gap-3">
                <span aria-hidden className="text-accent">
                  /
                </span>
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div className="card reveal p-6 sm:p-8">
          <p className="label text-sm tracking-[0.12em] text-muted">After graduation</p>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            {next.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function Certifications() {
  const viewer = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState<Certification | null>(null)
  const show = (c: Certification) => {
    setOpen(c)
    viewer.current?.showModal()
  }

  return (
    <div id="certs" className="card reveal p-6 sm:p-8">
      <h3 className="label mb-5 text-lg text-ok">Certifications</h3>
      <ul className="grid gap-x-10 gap-y-4 md:grid-cols-2">
        {certifications.map((c) => (
          <li key={c.title} className="flex items-center gap-4">
            {/* small thumbnail: zooms + overlay on hover, opens full size on click */}
            {c.image ? (
              <button
                type="button"
                onClick={() => show(c)}
                className="zoom-card relative block aspect-[13/10] w-24 shrink-0 cursor-zoom-in overflow-hidden bg-surface-2 shadow-[0_0_0_2px_var(--line)] sm:w-28"
                aria-label={`View ${c.title} certificate`}
              >
                <img src={c.image} alt={`${c.title} certificate from ${c.issuer}`} loading="lazy" className="zoom-img h-full w-full object-cover object-top" />
                <span className="zoom-overlay">
                  <span className="label text-lg text-ink">⤢</span>
                </span>
              </button>
            ) : (
              <span className="grid aspect-[13/10] w-24 shrink-0 place-items-center bg-surface-2 shadow-[0_0_0_2px_var(--line)] sm:w-28" aria-hidden>
                <Sprite rows={sprites.trophy} scale={3} />
              </span>
            )}
            <div className="min-w-0">
              <p className="font-medium leading-snug">{c.title}</p>
              <p className="label text-sm text-muted">
                {c.issuer}
                {c.date && ` · ${c.date}`}
              </p>
              {c.status && (
                <span className="label mt-1.5 inline-flex items-center gap-1.5 text-sm text-yellow">
                  <span aria-hidden className="blink inline-block h-2 w-2 bg-yellow" />
                  {c.status}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* full-size certificate viewer */}
      <dialog
        ref={viewer}
        className="m-auto w-fit max-w-[94vw] bg-transparent p-0 backdrop:bg-black/80"
        aria-label={open ? `${open.title} certificate` : 'Certificate'}
        onClick={(e) => {
          if (e.target === e.currentTarget) viewer.current?.close()
        }}
        onClose={() => setOpen(null)}
      >
        {open?.image && (
          <div className="px-box m-1">
            <div className="flex items-center justify-between gap-3 border-b-4 border-line bg-surface-2 px-4 py-2">
              <p className="label truncate text-sm">{open.title}</p>
              <button type="button" onClick={() => viewer.current?.close()} className="label px-2 text-lg hover:text-accent" aria-label="Close">
                ✕
              </button>
            </div>
            <img src={open.image} alt={`${open.title} certificate from ${open.issuer}`} className="block h-auto max-h-[78vh] w-auto max-w-full" />
          </div>
        )}
      </dialog>
    </div>
  )
}

function Contact() {
  const { email, linkedin } = profile.links
  return (
    <section id="contact" aria-labelledby="contact-title" className="pb-24">
      <Title id="contact">Contact</Title>
      <div className="reveal mx-auto max-w-xl text-center">
        <p className="text-lg leading-relaxed">
          I'm looking for an OJT / internship where I can contribute to real products. If you'd like to chat, my inbox is open.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {email && (
            <a href={`mailto:${email}`} className="px-btn">
              ✉ Email Me
            </a>
          )}
          {linkedin && (
            <a href={linkedin} target="_blank" rel="noreferrer" className="px-btn ghost">
              LinkedIn
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── Overlays ───────────────────────── */

function Toast({ msg }: { msg: string }) {
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 bottom-6 z-[85] flex justify-center px-4">
      <div className="px-box toast-in flex items-center gap-3 px-4 py-3">
        <Sprite rows={sprites.trophy} scale={3} />
        <p className="label text-sm text-accent">{msg}</p>
      </div>
    </div>
  )
}

function CoinRain() {
  const [coins] = useState(() =>
    Array.from({ length: 36 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.2,
      dur: 1.6 + Math.random() * 1.4,
      scale: 3 + Math.floor(Math.random() * 3),
    })),
  )
  const [on, setOn] = useState(true)
  useEffect(() => {
    const id = window.setTimeout(() => setOn(false), 4500)
    return () => clearTimeout(id)
  }, [])
  if (!on || reducedMotion()) return null
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[84] overflow-hidden">
      {coins.map((c) => (
        <span
          key={c.id}
          className="fall absolute top-0"
          style={{ left: `${c.left}%`, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s` }}
        >
          <Sprite rows={sprites.coin} scale={c.scale} />
        </span>
      ))}
    </div>
  )
}
