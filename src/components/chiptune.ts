/**
 * Tiny 8-bit music engine built on the Web Audio API — no audio files.
 * Two original, peaceful Japanese-style loops, one per theme:
 *
 *  • Night — "Lantern Festival": gentle bell-like koto plucks over a
 *    flowing arpeggio in the Hirajoshi scale (E · F♯ · G · B · C), a soft
 *    drone and the odd wind-chime ping. 66 BPM, no drums.
 *  • Day — "Morning Garden": a bright koto melody in the Yo scale
 *    (G · A · B · D · E), a shamisen-ish plucked bass, soft woodblock and
 *    taiko. 84 BPM.
 *
 * Switching Day/Night crossfades to the other loop.
 */

type Track = {
  bpm: number
  lead: string[][] // 8th notes per bar; '.' rest, '-' ring on
  voice: 'bell' | 'koto'
  roots: string[] // one per bar
  arp: (root: string) => string[] // 4-note plucked pattern
  arpEvery: number // pluck the arp every n 16ths (0 = never)
  bass: boolean
  perc: 'chimes' | 'garden'
}

const bars = (rows: string[]) => rows.map((r) => r.split(' '))

const NIGHT: Track = {
  bpm: 66,
  voice: 'bell',
  lead: bars([
    'B4 - G4 - F#4 E4 - -',
    'G4 - B4 C5 B4 - - -',
    'E5 - C5 B4 G4 - F#4 -',
    'E4 - - - . . . .',
    'B4 C5 E5 - F#5 E5 C5 -',
    'B4 - G4 B4 C5 - B4 -',
    'G4 F#4 E4 - G4 - B4 -',
    'E4 - - - . . . .',
  ]),
  roots: ['E2', 'C2', 'G2', 'E2', 'C2', 'G2', 'B1', 'E2'],
  arp: (r) =>
    ({
      E2: ['E3', 'B3', 'E4', 'G4'],
      C2: ['C3', 'G3', 'C4', 'E4'],
      G2: ['G2', 'B2', 'G3', 'B3'],
      B1: ['B2', 'F#3', 'B3', 'F#3'],
    })[r]!,
  arpEvery: 2,
  bass: false,
  perc: 'chimes',
}

const DAY: Track = {
  bpm: 84,
  voice: 'koto',
  lead: bars([
    'D5 E5 G5 - A5 G5 E5 -',
    'D5 - E5 D5 B4 - A4 -',
    'G4 A4 B4 - D5 - B4 A4',
    'G4 - - - . . A4 B4',
    'D5 E5 G5 - B5 A5 G5 -',
    'E5 - G5 E5 D5 - B4 -',
    'A4 B4 D5 - E5 D5 B4 A4',
    'G4 - - - . . . .',
  ]),
  roots: ['G2', 'D2', 'E2', 'G2', 'G2', 'E2', 'D2', 'G2'],
  arp: (r) =>
    ({
      G2: ['G3', 'D4', 'G4', 'B4'],
      D2: ['D3', 'A3', 'D4', 'A3'],
      E2: ['E3', 'B3', 'E4', 'B3'],
    })[r]!,
  arpEvery: 4,
  bass: true,
  perc: 'garden',
}

const NOTE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const freq = (n: string) => {
  const acc = n[1] === '#' ? 1 : n[1] === 'b' ? -1 : 0
  const midi = 12 * (Number(n.slice(-1)) + 1) + NOTE[n[0]] + acc
  return 440 * 2 ** ((midi - 69) / 12)
}

const isNight = () => document.documentElement.dataset.theme !== 'light'

let ctx: AudioContext | null = null
let master: GainNode
let fade: GainNode // used for crossfades between tracks
let bus: GainNode // musical voices → echo
let noise: AudioBuffer
let duty: PeriodicWave
let timer = 0
let step = 0
let nextTime = 0
let playing = false
let track: Track = NIGHT
const stepLen = () => 60 / track.bpm / 4

function init() {
  if (ctx) return ctx
  ctx = new AudioContext()
  master = ctx.createGain()
  master.gain.value = 0.045
  fade = ctx.createGain()
  fade.connect(master)
  const soften = ctx.createBiquadFilter()
  soften.type = 'lowpass'
  soften.frequency.value = 1500
  soften.Q.value = 0.3
  master.connect(soften).connect(ctx.destination)

  // soft echo for a spacious, open-air feel
  bus = ctx.createGain()
  const delay = ctx.createDelay(2)
  delay.delayTime.value = 0.42
  const feedback = ctx.createGain()
  feedback.gain.value = 0.3
  const wet = ctx.createGain()
  wet.gain.value = 0.3
  const tone = ctx.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = 2000
  bus.connect(fade)
  bus.connect(delay)
  delay.connect(tone).connect(feedback).connect(delay)
  tone.connect(wet).connect(fade)

  noise = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate)
  const d = noise.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1

  // 12.5% pulse — thin, plucky NES-style timbre
  const N = 32
  const re = new Float32Array(N)
  const im = new Float32Array(N)
  for (let k = 1; k < N; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.125)
  duty = ctx.createPeriodicWave(re, im)

  document.addEventListener('visibilitychange', () => {
    if (!ctx || !playing) return
    if (document.hidden) void ctx.suspend()
    else void ctx.resume()
  })
  // follow the Day/Night switch
  window.addEventListener('themechange', () => {
    const next = isNight() ? NIGHT : DAY
    if (next === track) return
    if (!playing) {
      track = next
      return
    }
    const t = ctx!.currentTime
    fade.gain.cancelScheduledValues(t)
    fade.gain.setValueAtTime(fade.gain.value, t)
    fade.gain.linearRampToValueAtTime(0.0001, t + 0.7)
    window.setTimeout(() => {
      track = next
      step = 0
      nextTime = ctx!.currentTime + 0.05
      const t2 = ctx!.currentTime
      fade.gain.setValueAtTime(0.0001, t2)
      fade.gain.linearRampToValueAtTime(1, t2 + 1.2)
    }, 720)
  })
  return ctx
}

/* ── voices ── */

/** Koto-ish pluck: instant attack, natural decay, tiny pitch "twang". */
function pluck(t: number, f: number, vol: number, decay: number, type: OscillatorType | 'pulse' = 'triangle', out: AudioNode = bus) {
  const c = ctx!
  const o = c.createOscillator()
  const g = c.createGain()
  if (type === 'pulse') o.setPeriodicWave(duty)
  else o.type = type
  o.frequency.setValueAtTime(f * 1.012, t)
  o.frequency.exponentialRampToValueAtTime(f, t + 0.04)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
  o.connect(g).connect(out)
  o.start(t)
  o.stop(t + decay + 0.05)
}

/** Bell-like koto: a pure tone plus a quiet octave, long gentle decay. */
function bell(t: number, f: number, vol: number, decay: number) {
  pluck(t, f, vol, decay, 'sine')
  pluck(t, f, vol * 0.45, decay * 0.7, 'triangle')
  pluck(t, f * 2, vol * 0.12, decay * 0.4, 'sine')
}

/** Soft sustained drone. */
function drone(t: number, f: number, dur: number, vol: number) {
  const c = ctx!
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'triangle'
  o.frequency.value = f
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.6)
  g.gain.setValueAtTime(vol, t + dur - 0.5)
  g.gain.linearRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(fade)
  o.start(t)
  o.stop(t + dur + 0.05)
}

/** Wind-chime ping. */
function chime(t: number, f: number) {
  pluck(t, f, 0.06, 2.2, 'sine')
  pluck(t + 0.01, f * 2.01, 0.025, 1.4, 'sine')
}

/** Woodblock tap. */
function block(t: number, vol: number) {
  const c = ctx!
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(950, t)
  o.frequency.exponentialRampToValueAtTime(700, t + 0.05)
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07)
  o.connect(g).connect(fade)
  o.start(t)
  o.stop(t + 0.08)
}

/** Soft taiko thump. */
function taiko(t: number, vol: number) {
  const c = ctx!
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(110, t)
  o.frequency.exponentialRampToValueAtTime(55, t + 0.25)
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
  o.connect(g).connect(fade)
  o.start(t)
  o.stop(t + 0.36)
}

/* ── sequencer ── */

function schedule(s: number, t: number) {
  const T = track
  const STEP = stepLen()
  const bar = Math.floor(s / 16) % T.lead.length
  const i = s % 16
  const root = T.roots[bar]

  if (i === 0) {
    drone(t, freq(root), STEP * 16, T.voice === 'bell' ? 0.18 : 0.16)
    drone(t, freq(root) * 1.5, STEP * 16, T.voice === 'bell' ? 0.08 : 0.08)
  }

  // lead
  if (i % 2 === 0) {
    const notes = T.lead[bar]
    const k = i / 2
    const n = notes[k]
    if (n !== '.' && n !== '-') {
      let len = 1
      while (notes[k + len] === '-') len++
      if (T.voice === 'bell') bell(t, freq(n), 0.3, 1.2 + len * 0.35)
      else {
        pluck(t, freq(n), 0.32, 0.6 + len * 0.25, 'triangle')
      }
    }
  }

  // plucked arpeggio
  if (T.arpEvery && i % T.arpEvery === 0) {
    const notes = T.arp(root)
    pluck(t, freq(notes[(i / T.arpEvery) % notes.length]), T.voice === 'bell' ? 0.05 : 0.08, T.voice === 'bell' ? 0.9 : 0.45, T.voice === 'bell' ? 'triangle' : 'pulse')
  }

  // shamisen-ish bass (day)
  if (T.bass && (i === 0 || i === 8)) pluck(t, freq(root) * 2, 0.16, 0.35, 'pulse', fade)
  if (T.bass && i === 12) pluck(t, freq(root) * 3, 0.1, 0.25, 'pulse', fade)

  // percussion
  if (T.perc === 'garden') {
    if (i === 0 && bar % 2 === 0) taiko(t, 0.12)
    if (i === 8) block(t, 0.04)
  } else if (i === 6 && bar % 2 === 1) {
    // night: a wind chime every other bar, on a scale note
    const pool = ['E6', 'B5', 'G5', 'C6', 'F#5']
    chime(t, freq(pool[(bar + s) % pool.length]))
  }
}

function tick() {
  const c = ctx!
  while (nextTime < c.currentTime + 0.15) {
    schedule(step, nextTime)
    nextTime += stepLen()
    step = (step + 1) % (track.lead.length * 16)
  }
}

export function startMusic() {
  const c = init()
  if (playing) return
  playing = true
  track = isNight() ? NIGHT : DAY
  void c.resume()
  fade.gain.setValueAtTime(1, c.currentTime)
  step = 0
  nextTime = c.currentTime + 0.08
  timer = window.setInterval(tick, 25)
  tick()
}

export function stopMusic() {
  playing = false
  clearInterval(timer)
  if (ctx) void ctx.suspend()
}

/** Short soft "blip" for clicks, tuned to the current track's scale. */
export function blip(high = false) {
  const c = init()
  void c.resume()
  const t = c.currentTime
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'square'
  const [a, b] = isNight() ? (high ? [880, 1175] : [587, 880]) : high ? [784, 1175] : [587, 784]
  o.frequency.setValueAtTime(a, t)
  o.frequency.setValueAtTime(b, t + 0.045)
  g.gain.setValueAtTime(0.025, t)
  g.gain.linearRampToValueAtTime(0, t + 0.1)
  o.connect(g).connect(c.destination)
  o.start(t)
  o.stop(t + 0.11)
}

/** Whether click/warp sound effects are enabled (mirrors the Music toggle). */
let sfx = false
export const setSfx = (on: boolean) => {
  sfx = on
}

/** Rising 8-bit "warp" sweep. */
export function warpSound() {
  if (!sfx) return
  const c = init()
  void c.resume()
  const t = c.currentTime
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'square'
  o.frequency.setValueAtTime(180, t)
  o.frequency.exponentialRampToValueAtTime(1400, t + 0.32)
  g.gain.setValueAtTime(0.09, t)
  g.gain.setValueAtTime(0.09, t + 0.28)
  g.gain.linearRampToValueAtTime(0, t + 0.36)
  o.connect(g).connect(c.destination)
  o.start(t)
  o.stop(t + 0.37)
}
