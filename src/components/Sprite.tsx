/**
 * Tiny pixel-art renderer. Each sprite is an array of strings;
 * every character is one pixel and maps to a CSS colour variable
 * (so sprites recolour themselves with the theme). '.' is transparent.
 */

const palette: Record<string, string> = {
  k: 'var(--sp-k)', // outline
  y: 'var(--sp-y)', // main (cyan)
  w: 'var(--sp-w)', // highlight
  n: 'var(--sp-n)', // dark blue
  a: 'var(--sp-a)', // player 2
  c: 'var(--sp-c)', // player 1
}

type Props = {
  rows: string[]
  scale?: number
  className?: string
  label?: string
  flip?: boolean
}

export function Sprite({ rows, scale = 4, className = '', label, flip }: Props) {
  const w = rows[0].length
  const h = rows.length
  const rects: React.ReactElement[] = []
  rows.forEach((row, y) => {
    let x = 0
    while (x < w) {
      const ch = row[x]
      if (ch === '.' || ch === undefined) {
        x++
        continue
      }
      let run = 1
      while (row[x + run] === ch) run++
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={palette[ch] ?? ch} />)
      x += run
    }
  })
  return (
    <svg
      className={`sprite ${className}`}
      viewBox={`0 0 ${w} ${h}`}
      width={w * scale}
      height={h * scale}
      shapeRendering="crispEdges"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {rects}
    </svg>
  )
}

export const sprites = {
  coin: ['.kkkk.', 'kyyyyk', 'kywyyk', 'kywyyk', 'kywyyk', 'kyyyyk', '.kkkk.'],
  trophy: [
    'yyyyyyyyyy',
    'y.ywyyyy.y',
    'y.ywyyyy.y',
    '.yyyyyyyy.',
    '..yyyyyy..',
    '....yy....',
    '....yy....',
    '..nnnnnn..',
    '..nnnnnn..',
  ],
  save: [
    'kkkkkkkkkk',
    'kaawwwwaak',
    'kaawwwwaak',
    'kaaaaaaaak',
    'kaaaaaaaak',
    'kakkkkkkak',
    'kakwwwwkak',
    'kkkkkkkkkk',
  ],
}
