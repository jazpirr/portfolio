/**
 * Tiny 8-bit music engine built on the Web Audio API — no audio files.
 * An original 8-bar loop in A minor (Am – F – C – G): square-wave lead,
 * triangle bass, a quiet arpeggio and noise drums.
 */

const BPM = 132
const STEP = 60 / BPM / 4 // one 16th note, in seconds

// Melody in 8th notes, 8 per bar. '.' = rest, '-' = hold previous note.
const LEAD = [
  'E5 C5 A4 C5 E5 - D5 C5',
  'A4 - C5 - F5 - E5 D5',
  'E5 - G5 - C6 - B5 A5',
  'B5 - G5 - D5 - B4 -',
  'A5 - G5 E5 - C5 D5 E5',
  'F5 - E5 C5 - A4 C5 F5',
  'G5 - E5 C5 E5 G5 C6 -',
  'B5 - D6 - B5 G5 . .',
].map((bar) => bar.split(' '))

// One chord per bar: [bass root, arpeggio notes]
const CHORDS: [string, string[]][] = [
  ['A2', ['A3', 'C4', 'E4', 'C4']],
  ['F2', ['F3', 'A3', 'C4', 'A3']],
  ['C3', ['C4', 'E4', 'G4', 'E4']],
  ['G2', ['G3', 'B3', 'D4', 'B3']],
]

const NOTE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const freq = (n: string) => {
  const midi = 12 * (Number(n.slice(-1)) + 1) + NOTE[n[0]] + (n[1] === '#' ? 1 : 0)
  return 440 * 2 ** ((midi - 69) / 12)
}

let ctx: AudioContext | null = null
let master: GainNode
let noise: AudioBuffer
let duty25: PeriodicWave
let timer = 0
let step = 0
let nextTime = 0
let playing = false

function init() {
  if (ctx) return ctx
  ctx = new AudioContext()
  master = ctx.createGain()
  master.gain.value = 0.11
  master.connect(ctx.destination)

  noise = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate)
  const d = noise.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1

  // 25% pulse wave — the classic NES lead timbre.
  const N = 32
  const re = new Float32Array(N)
  const im = new Float32Array(N)
  for (let k = 1; k < N; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25)
  duty25 = ctx.createPeriodicWave(re, im)

  document.addEventListener('visibilitychange', () => {
    if (!ctx || !playing) return
    if (document.hidden) void ctx.suspend()
    else void ctx.resume()
  })
  return ctx
}

function tone(t: number, f: number, dur: number, vol: number, type: OscillatorType | 'pulse') {
  const c = ctx!
  const o = c.createOscillator()
  const g = c.createGain()
  if (type === 'pulse') o.setPeriodicWave(duty25)
  else o.type = type
  o.frequency.value = f
  g.gain.setValueAtTime(vol, t)
  g.gain.setValueAtTime(vol, t + dur * 0.7)
  g.gain.linearRampToValueAtTime(0, t + dur)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + dur + 0.02)
}

function hit(t: number, dur: number, vol: number, hp: number) {
  const c = ctx!
  const s = c.createBufferSource()
  s.buffer = noise
  const f = c.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = hp
  const g = c.createGain()
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  s.connect(f).connect(g).connect(master)
  s.start(t)
  s.stop(t + dur)
}

function kick(t: number) {
  const c = ctx!
  const o = c.createOscillator()
  const g = c.createGain()
  o.frequency.setValueAtTime(150, t)
  o.frequency.exponentialRampToValueAtTime(40, t + 0.12)
  g.gain.setValueAtTime(0.7, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + 0.16)
}

function schedule(s: number, t: number) {
  const bar = Math.floor(s / 16) % LEAD.length
  const i = s % 16
  const [root, arp] = CHORDS[bar % CHORDS.length]

  // lead (8th notes, '-' extends the previous note)
  if (i % 2 === 0) {
    const notes = LEAD[bar]
    const k = i / 2
    const n = notes[k]
    if (n !== '.' && n !== '-') {
      let len = 1
      while (notes[k + len] === '-') len++
      tone(t, freq(n), STEP * 2 * len - 0.02, 0.32, 'pulse')
    }
  }
  // bass: root / octave bounce on 8ths
  if (i % 2 === 0) {
    const f = freq(root) * (i % 4 === 2 ? 2 : 1)
    tone(t, f, STEP * 1.8, 0.5, 'triangle')
  }
  // quiet arpeggio on 16ths
  tone(t, freq(arp[i % 4]), STEP * 0.9, 0.07, 'square')
  // drums
  if (i === 0 || i === 8 || i === 10) kick(t)
  if (i === 4 || i === 12) hit(t, 0.12, 0.35, 1200)
  if (i % 2 === 1) hit(t, 0.03, 0.12, 7000)
}

function tick() {
  const c = ctx!
  while (nextTime < c.currentTime + 0.12) {
    schedule(step, nextTime)
    nextTime += STEP
    step = (step + 1) % (LEAD.length * 16)
  }
}

export function startMusic() {
  const c = init()
  if (playing) return
  playing = true
  void c.resume()
  step = 0
  nextTime = c.currentTime + 0.06
  timer = window.setInterval(tick, 25)
  tick()
}

export function stopMusic() {
  playing = false
  clearInterval(timer)
  if (ctx) void ctx.suspend()
}

/** Short 8-bit "blip" for clicks. */
export function blip(high = false) {
  const c = init()
  void c.resume()
  const t = c.currentTime
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'square'
  o.frequency.setValueAtTime(high ? 990 : 660, t)
  o.frequency.setValueAtTime(high ? 1320 : 990, t + 0.045)
  g.gain.setValueAtTime(0.12, t)
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

/** Rising 8-bit "warp" sweep for jumping between sections. */
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
