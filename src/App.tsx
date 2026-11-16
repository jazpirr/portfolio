import { useCallback, useEffect, useRef, useState } from 'react'
import { ProjectCard } from './components/ProjectCard'
import { Sprite, sprites } from './components/Sprite'
import {
  addScore,
  BootScreen,
  PixelTrail,
  reducedMotion,
  Starfield,
  useActiveSection,
  useKonami,
  useReveal,
  useScrollProgress,
  useTilt,
  useTypewriter,
} from './components/effects'
import { blip, setSfx, startMusic, stopMusic, warpSound } from './components/chiptune'
import { certifications, education, featured, others, profile, skills, stats } from './data/portfolio'

const NAV = [
  { id: 'stages', label: 'Projects' },
  { id: 'about', label: 'About' },
  { id: 'inventory', label: 'Skills' },
  { id: 'quests', label: 'Education' },
  { id: 'achievements', label: 'Certs' },
  { id: 'contact', label: 'Contact' },
]
const NAV_IDS = NAV.map((n) => n.id)

type Style = React.CSSProperties & Record<`--${string}`, string>

export default function App() {
  useReveal()
  useTilt()
  const [toast, setToast] = useState<string | null>(null)
  const [rain, setRain] = useState(0)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2800)
  }, [])

  useKonami(() => {
    addScore(30000)
    setRain((r) => r + 1)
    showToast('Cheat code accepted · +30000')
  })

  return (
    <>
      <BootScreen name={profile.handle} />
      <Starfield />
      <PixelTrail />
      <div aria-hidden className="scanlines" />
      <a
        href="#stages"
        data-instant
        className="label sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:bg-accent focus:px-3 focus:py-2 focus:text-on-accent"
      >
        Skip to projects
      </a>
      <Hud />
      <main>
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <Hero />
        </div>
        <Ticker />
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <Stages />
          <SideQuests />
          <About />
          <Inventory />
          <QuestLog />
          <Achievements onUnlock={showToast} />
          <Continue />
        </div>
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-center sm:px-8">
        <p className="text-sm text-muted">© {new Date().getFullYear()} {profile.name}</p>
        <p className="label mt-1 text-xs text-muted">↑ ↑ ↓ ↓ ← → ← → B A</p>
      </footer>
      {toast && <Toast msg={toast} />}
      {rain > 0 && <CoinRain key={rain} />}
      <Warp />
    </>
  )
}

/* ───────────────────────── HUD ───────────────────────── */

function Hud() {
  const progress = useScrollProgress()
  const active = useActiveSection(NAV_IDS)
  const [bonus, setBonus] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const on = (e: Event) => setBonus((b) => b + (e as CustomEvent<number>).detail)
    window.addEventListener('score', on)
    return () => window.removeEventListener('score', on)
  }, [])

  const score = Math.round(progress * 10000) + bonus

  return (
    <header className="sticky top-0 z-50 border-b-4 border-line bg-bg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
        <a href="#top" className="flex items-center gap-2 font-pixel text-xs" aria-label="Back to top">
          <span className="text-accent">JQ</span>
          <span className="label hidden whitespace-nowrap text-sm text-muted sm:inline lg:hidden xl:inline">{profile.name}</span>
        </a>

        <nav aria-label="Sections" className="hidden lg:block">
          <ul className="label flex gap-5">
            {NAV.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  aria-current={active === n.id ? 'true' : undefined}
                  className={`cursor-arrow hover:text-accent ${active === n.id ? 'text-accent' : ''}`}
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <p className="label whitespace-nowrap text-sm tabular-nums" aria-label={`Score ${score}`}>
            <span className="text-muted">Score </span>
            {String(score).padStart(6, '0')}
          </p>
          <SoundToggle />
          <ThemeToggle />
          <button
            type="button"
            className="px-thin label grid h-9 w-9 place-items-center bg-surface lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? '✕' : '≡'}
          </button>
        </div>
      </div>

      {/* XP bar = scroll progress (scaleX → no layout work) */}
      <div className="h-1.5 bg-surface-2" aria-hidden>
        <div className="h-full origin-left bg-accent" style={{ transform: `scaleX(${progress})` }} />
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Sections" className="border-t-4 border-line bg-surface lg:hidden">
          <ul className="label mx-auto max-w-6xl px-4 py-2 text-base">
            {NAV.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  onClick={() => setOpen(false)}
                  aria-current={active === n.id ? 'true' : undefined}
                  className="cursor-arrow block py-3"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}

/**
 * 8-bit music + click blips. Off by default; the choice is remembered.
 * Browsers only allow audio after a user gesture, so a saved "on" waits
 * for the first click/key before starting.
 */
function SoundToggle() {
  const [on, setOn] = useState(() => {
    try {
      return localStorage.getItem('sound') !== 'off'
    } catch {
      return true
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
    // Try now (works when toggled by a click); otherwise wait for a gesture.
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
      if (el && !el.hasAttribute('data-no-blip') && !el.getAttribute('href')?.startsWith('#')) blip(el.classList.contains('px-btn'))
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
      aria-label={on ? 'Turn music and sound off' : 'Turn music and sound on'}
      title={on ? 'Music on' : 'Music off'}
      className={`px-thin label flex h-9 items-center gap-1.5 px-2.5 text-xs hover:bg-surface-2 ${on ? 'bg-accent text-on-accent hover:text-ink' : 'bg-surface'}`}
    >
      <span aria-hidden className={on ? '' : 'opacity-60'}>♪</span>
      <span className="hidden whitespace-nowrap sm:inline lg:hidden xl:inline">{on ? 'Music on' : 'Music'}</span>
      {on && (
        <span aria-hidden className="flex h-3 items-end gap-px">
          <span className="eq h-full w-[3px] bg-current" />
          <span className="eq h-full w-[3px] bg-current [animation-delay:-.3s]" />
          <span className="eq h-full w-[3px] bg-current [animation-delay:-.6s]" />
        </span>
      )}
    </button>
  )
}

function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme ?? 'dark')
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.dataset.theme = next
        try {
          localStorage.setItem('theme', next)
        } catch {
          /* ignore */
        }
        window.dispatchEvent(new Event('themechange'))
        setTheme(next)
      }}
      aria-label={`Switch to ${next === 'light' ? 'day' : 'night'} mode`}
      className="px-thin label h-9 whitespace-nowrap bg-surface px-2.5 text-xs hover:bg-surface-2"
    >
      {theme === 'dark' ? '☀ Day' : '☾ Night'}
    </button>
  )
}

/* ───────────────────────── Hero ───────────────────────── */

const TERMINAL = [
  '> whoami',
  profile.name,
  '> cat role.txt',
  'IT Student @ CIT-U · 4th year',
  '> ls skills/',
  'java  kotlin  spring-boot  react',
  'django  postgresql  android',
  '> echo $STATUS',
  'OPEN_TO_OJT=true',
].join('\n')

function Hero() {
  // 'Jazpher Neil P. Quirante' → JAZPHER / NEIL P. / QUIRANTE
  const words = profile.name.toUpperCase().split(' ')
  const lines = [words[0], words.slice(1, -1).join(' '), words[words.length - 1]].filter(Boolean)

  return (
    <section id="top" className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr]">
      <div className="min-w-0">
        <p className="label flex items-center gap-2.5 text-ok">
          <span className="blink inline-block h-2.5 w-2.5 bg-ok" aria-hidden />
          {profile.status}
        </p>

        <h1 className="mt-6 font-pixel text-[clamp(1.75rem,6vw,3.5rem)] leading-[1.25]">
          <span className="sr-only">{profile.name}</span>
          {lines.map((l, i) => (
            <span key={l} aria-hidden className={`title-shadow-pop block ${i === 1 ? 'text-soft' : i === 2 ? 'text-accent' : 'text-ink'}`}>
              {l}
            </span>
          ))}
        </h1>

        <p className="label mt-6 text-base text-muted">{profile.role}</p>

        <p className="mt-6 max-w-xl text-lg leading-relaxed">{profile.greeting}</p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a href="#stages" className="px-btn">▶ View projects</a>
          <a href={profile.links.github} target="_blank" rel="noreferrer" className="px-btn ghost">GitHub</a>
          {profile.links.resume && (
            <a href={profile.links.resume} target="_blank" rel="noreferrer" className="px-btn ghost">Résumé</a>
          )}
        </div>
      </div>

      <Terminal />
    </section>
  )
}

function Terminal() {
  const typed = useTypewriter(TERMINAL, 32, 700)
  const done = typed.length === TERMINAL.length
  const lines = (s: string, cursor = false) => {
    const all = s.split('\n')
    return all.map((l, i) => (
      <div key={i} className={l.startsWith('>') ? 'text-accent' : 'text-ink'}>
        {l || (cursor ? '' : ' ')}
        {cursor && i === all.length - 1 && (
          <span className="blink ml-0.5 inline-block h-4 w-2.5 translate-y-0.5 bg-accent" />
        )}
      </div>
    ))
  }

  return (
    <div className="min-w-0">
      <div className="px-box" style={{ '--sh': 'var(--shadow)' } as Style}>
        <div className="flex items-center justify-between border-b-4 border-line bg-surface-2 px-4 py-2">
          <span className="label text-xs text-muted">jazpher@cit-u: ~</span>
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-3 w-3 bg-pink" />
            <span className="h-3 w-3 bg-yellow" />
            <span className="h-3 w-3 bg-ok" />
          </span>
        </div>
        <div className="relative bg-bg p-5 text-sm leading-7 sm:text-[15px]">
          <pre className="sr-only">{TERMINAL}</pre>
          {/* invisible copy reserves the final height so nothing jumps */}
          <div aria-hidden className="invisible whitespace-pre-wrap">{lines(TERMINAL + '\n> ')}</div>
          <div aria-hidden className="absolute inset-0 whitespace-pre-wrap p-5">
            {lines(typed + (done ? '\n> ' : ''), true)}
          </div>
        </div>
      </div>

      <dl className="px-box mt-8 grid grid-cols-2 gap-x-4 gap-y-3 p-4 sm:grid-cols-4">
        {stats.map(([k, v], n) => (
          <div key={k}>
            <dt className={`label text-xs ${POP_TEXT[n % POP_TEXT.length]}`}>{k}</dt>
            <dd className="text-sm">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function Ticker() {
  const items = ['Open to OJT', 'Java', 'Kotlin', 'Spring Boot', 'React', 'Django', 'Android', 'PostgreSQL', 'AWS']
  const row = items.map((t, n) => (
    <span key={t} className="flex items-center gap-6 px-3">
      <span className={POP_TEXT[n % POP_TEXT.length]}>{t}</span>
      <span className="text-muted">✦</span>
    </span>
  ))
  return (
    <div className="label my-6 overflow-hidden border-y-4 border-line bg-surface py-2.5 text-base" aria-hidden>
      <div className="marquee flex w-max">
        {row}
        {row}
      </div>
    </div>
  )
}

/* ───────────────────────── Sections ───────────────────────── */

/* Accent colours rotate through sections/cards so blue stays the base. */
const POP = ['var(--yellow)', 'var(--pink)', 'var(--ok)', 'var(--orange)', 'var(--purple)', 'var(--accent)']
const POP_TEXT = ['text-yellow', 'text-pink', 'text-ok', 'text-orange', 'text-purple', 'text-accent']

function SectionHead({ id, world, title, note, color }: { id: string; world: string; title: string; note?: string; color: string }) {
  return (
    <div className="reveal from-left mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="label" style={{ color }}>
          {world}
        </p>
        <h2 id={`${id}-title`} className="wipe mt-3 font-pixel text-xl sm:text-3xl" style={{ textShadow: `4px 4px 0 ${color}` }}>
          {title}
        </h2>
      </div>
      {note && <p className="label text-muted">{note}</p>}
    </div>
  )
}

function Stages() {
  return (
    <section id="stages" aria-labelledby="stages-title" className="pb-12 pt-8 sm:pb-16">
      <SectionHead id="stages" world="World 1" title="PROJECTS" note={`${featured.length} stages cleared`} color="var(--accent)" />
      <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
        {featured.map((p, i) => (
          <ProjectCard key={p.title} project={p} n={i + 1} color={POP[i % POP.length]} />
        ))}
      </div>
    </section>
  )
}

function SideQuests() {
  return (
    <section aria-labelledby="side-title" className="pb-16 sm:pb-24">
      <h3 id="side-title" className="label reveal mb-6 text-base text-muted">
        + Side quests
      </h3>
      <ul className="grid gap-5 sm:grid-cols-2">
        {others.map((p, n) => (
          <li key={p.title} className={`reveal ${n % 2 ? 'from-right' : 'from-left'}`}>
            <a
              href={p.repo}
              target="_blank"
              rel="noreferrer"
              className="px-box lift group flex h-full flex-col p-5"
              style={{ '--o': '6px', '--sh': POP[(n + 1) % POP.length] } as Style}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="label text-lg normal-case tracking-normal group-hover:text-accent">{p.title}</span>
                <span aria-hidden className="text-muted group-hover:text-accent">↗</span>
              </div>
              <span className="label text-xs text-muted">
                {p.context} · {p.year}
              </span>
              <span className="mt-2 flex-1 text-sm leading-relaxed text-muted">{p.description}</span>
              <span className={`label mt-3 text-xs ${POP_TEXT[(n + 1) % POP_TEXT.length]}`}>{p.stack.join(' · ')}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="pb-16 sm:pb-24">
      <SectionHead id="about" world="World 2" title="ABOUT ME" color="var(--pink)" />
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="reveal from-left space-y-5 text-lg leading-relaxed lg:col-span-7">
          {profile.about.map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
        </div>
        <dl className="px-box reveal from-right h-fit divide-y-2 divide-surface-2 lg:col-span-5">
          {[
            ['Name', profile.name],
            ['School', profile.school],
            ['Course', 'BS Information Technology'],
            ['Based in', profile.location],
            ['Seeking', 'OJT — web, mobile or back-end'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-6 px-5 py-3">
              <dt className="label text-xs text-muted">{k}</dt>
              <dd className="text-right text-sm">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function Inventory() {
  return (
    <section id="inventory" aria-labelledby="inventory-title" className="pb-16 sm:pb-24">
      <SectionHead id="inventory" world="World 3" title="SKILLS" note="Inventory" color="var(--yellow)" />
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((g, n) => (
          <div
            key={g.group}
            className="px-box reveal pop tilt p-5"
            style={{ '--o': '6px', '--sh': POP[n % POP.length], '--pop': POP[n % POP.length] } as Style}
          >
            <h3 className="label" style={{ color: 'var(--pop)' }}>
              {g.group}
            </h3>
            <ul className="mt-4 grid grid-cols-2 gap-2">
              {g.items.map((s) => (
                <li
                  key={s}
                  className="px-thin cursor-default bg-surface-2 px-2 py-1.5 text-center text-sm hover:bg-(--pop) hover:text-on-accent"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

function QuestLog() {
  return (
    <section id="quests" aria-labelledby="quests-title" className="pb-16 sm:pb-24">
      <SectionHead id="quests" world="World 4" title="EDUCATION" note="Quest log" color="var(--ok)" />
      <ol className="relative ml-3 border-l-4 border-dashed border-line pl-8 sm:ml-6">
        {education.map((e, i) => (
          <li key={e.level} className="reveal from-right relative pb-10 last:pb-0">
            <span className="absolute -left-[3.05rem] top-0 bg-bg p-1" aria-hidden>
              <Sprite rows={sprites.save} scale={3} />
            </span>
            <p className="label text-xs text-ok">
              {i === 0 ? 'Current quest' : 'Complete'} · {e.years}
            </p>
            <h3 className="label mt-1 text-xl normal-case tracking-normal">{e.level}</h3>
            <p className="text-base">{e.school}</p>
            {e.detail && <p className="text-sm text-soft">{e.detail}</p>}
          </li>
        ))}
      </ol>
    </section>
  )
}

function Achievements({ onUnlock }: { onUnlock: (m: string) => void }) {
  const ref = useRef<HTMLElement>(null)
  const fired = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !fired.current) {
          fired.current = true
          addScore(500)
          onUnlock(`Achievements unlocked · ${certifications.length}/${certifications.length}`)
        }
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [onUnlock])

  return (
    <section ref={ref} id="achievements" aria-labelledby="achievements-title" className="pb-16 sm:pb-24">
      <SectionHead id="achievements" world="World 5" title="CERTIFICATES" note="Achievements" color="var(--purple)" />
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {certifications.map((c, i) => (
          <li
            key={c.title + c.detail}
            className="px-box lift reveal pop flex items-center gap-4 p-4"
            style={{ transitionDelay: `${i * 70}ms`, '--o': '6px', '--sh': POP[i % POP.length] } as Style}
          >
            <span className="grid h-16 w-16 shrink-0 place-items-center bg-surface-2">
              <Sprite rows={sprites.trophy} scale={4} />
            </span>
            <div className="min-w-0">
              <p className={`label text-xs ${POP_TEXT[i % POP_TEXT.length]}`}>Unlocked · {c.issuer}</p>
              <p className="mt-0.5 font-medium leading-snug">{c.title}</p>
              <p className="text-sm text-muted">{c.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Continue() {
  const ref = useRef<HTMLElement>(null)
  const [count, setCount] = useState(9)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || reducedMotion()) return
    const id = window.setInterval(() => setCount((c) => (c === 0 ? 9 : c - 1)), 1000)
    return () => clearInterval(id)
  }, [visible])

  const { email, linkedin, github, resume } = profile.links
  const links = [
    email && { label: 'Email', href: `mailto:${email}`, text: email },
    linkedin && { label: 'LinkedIn', href: linkedin, text: linkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') },
    { label: 'GitHub', href: github, text: github.replace(/^https?:\/\//, '') },
    resume && { label: 'Résumé', href: resume, text: 'Download PDF' },
  ].filter(Boolean) as { label: string; href: string; text: string }[]

  return (
    <section ref={ref} id="contact" aria-labelledby="contact-title" className="pb-16 sm:pb-24">
      <div className="px-box reveal pop p-6 text-center sm:p-12" style={{ '--sh': 'var(--orange)' } as Style}>
        <h2 id="contact-title" className="title-shadow-pop font-pixel text-2xl sm:text-4xl">
          CONTINUE?
        </h2>
        <p aria-hidden className="mt-6 font-pixel text-5xl text-yellow sm:text-6xl">
          {count}
        </p>
        <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed">
          Looking for an OJT trainee who ships? I'd love to talk — and walk you through any of these projects.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {email && (
            <a href={`mailto:${email}`} className="px-btn">
              <Sprite rows={sprites.coin} scale={2} /> Insert coin
            </a>
          )}
          {linkedin && (
            <a href={linkedin} target="_blank" rel="noreferrer" className="px-btn ghost">LinkedIn</a>
          )}
        </div>
        <ul className="mx-auto mt-10 max-w-xl divide-y-2 divide-surface-2 border-y-2 border-surface-2 text-left">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                target={l.href.startsWith('mailto:') ? undefined : '_blank'}
                rel="noreferrer"
                className="group flex items-center justify-between gap-4 py-3"
              >
                <span className="label text-xs text-muted">{l.label}</span>
                <span className="truncate text-sm group-hover:text-accent">{l.text} ↗</span>
              </a>
            </li>
          ))}
        </ul>
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

/* ───────────── Level-transition "warp" for in-page links ───────────── */

const WORLDS: Record<string, [string, string]> = {
  top: ['Title screen', 'Start'],
  stages: ['World 1', 'Projects'],
  about: ['World 2', 'About me'],
  inventory: ['World 3', 'Skills'],
  quests: ['World 4', 'Education'],
  achievements: ['World 5', 'Certificates'],
  contact: ['Final stage', 'Contact'],
}
const WARP_COLS = 12
const CLOSE_MS = 330
const HOLD_MS = 200

/**
 * Clicking any "#section" link plays a retro stage transition: pixel
 * columns drop down, the world name flashes, the page jumps, the columns
 * lift away and the section title wipes in again.
 */
function Warp() {
  const [phase, setPhase] = useState<'close' | 'open' | null>(null)
  const [label, setLabel] = useState<[string, string]>(['', ''])
  const busy = useRef(false)

  useEffect(() => {
    const go = (id: string) => {
      const el = document.getElementById(id)
      if (!el) return
      const land = () => {
        el.scrollIntoView({ behavior: 'instant', block: 'start' })
        history.pushState(null, '', `#${id}`)
        el.setAttribute('tabindex', '-1')
        el.focus({ preventScroll: true })
      }
      if (reducedMotion()) {
        land()
        return
      }
      if (busy.current) return
      busy.current = true
      setLabel(WORLDS[id] ?? ['Next stage', id])
      setPhase('close')
      warpSound()
      window.setTimeout(() => {
        land()
        // replay the section title's entrance behind the curtain
        const head = el.querySelector('.wipe')?.closest('.reveal')
        head?.classList.remove('in')
        window.setTimeout(() => {
          setPhase('open')
          window.setTimeout(() => head?.classList.add('in'), 120)
        }, HOLD_MS)
        window.setTimeout(() => {
          setPhase(null)
          busy.current = false
        }, HOLD_MS + CLOSE_MS + WARP_COLS * 20 + 60)
      }, CLOSE_MS + WARP_COLS * 20)
    }

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]')
      if (!a || a.hasAttribute('data-instant')) return
      const id = a.getAttribute('href')!.slice(1)
      if (!document.getElementById(id)) return
      e.preventDefault()
      go(id)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  if (!phase) return null
  return (
    <div aria-hidden className="pointer-events-auto fixed inset-0 z-[96] flex">
      {Array.from({ length: WARP_COLS }, (_, i) => (
        <span
          key={i}
          className={`warp-col h-full flex-1 ${i % 2 ? 'bg-surface' : 'bg-bg'} ${phase === 'close' ? 'warp-close' : 'warp-open'}`}
          style={{ animationDelay: `${(phase === 'close' ? i : WARP_COLS - 1 - i) * 20}ms` }}
        />
      ))}
      <div className={`absolute inset-0 grid place-items-center text-center ${phase === 'close' ? 'warp-label-in' : 'warp-label-out'}`}>
        <div>
          <p className="label text-lg text-yellow">{label[0]}</p>
          <p className="title-shadow-pop mt-4 font-pixel text-2xl text-ink sm:text-4xl">{label[1].toUpperCase()}</p>
          <p className="label blink mt-5 text-base text-accent">Ready!</p>
        </div>
      </div>
    </div>
  )
}
