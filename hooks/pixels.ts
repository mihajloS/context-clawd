// What every sprite set draws with: the level colors and SMIL frame builders.
// Coordinates are in pixel units; the desktop draws one unit as SCALE CSS px.

import type { ClawdLevel } from '../types'

export const COLOR: Record<ClawdLevel, string> = {
  fresh: '#D97757',
  ok: '#D97757',
  warn: '#EDB436',
  over: '#E5484D',
}

export const SCALE = 2
export const ALERT_SECONDS = 2.4

const EYE = '#1F1E1D'
const SWEAT = '#7CC4F2'
const SHADOW = '#8A8A8A'

export type Scene =
  | { kind: 'idle'; level: ClawdLevel }
  | { kind: 'working'; level: ClawdLevel }
  | { kind: 'alert'; from: ClawdLevel; to: 'warn' | 'over' }

export type SpriteSet = {
  // In pixel units, like everything the set draws.
  width: number
  height: number
  draw: (scene: Scene) => string
}

export type Eyes = 'blink' | 'tired' | 'open'

export const rect = (x: number, y: number, w: number, h: number, inner = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}">${inner}</rect>`

const ending = (loop: boolean) => (loop ? 'repeatCount="indefinite"' : 'fill="freeze"')

// Discrete frames, each held for dur / values.length, the way a sprite sheet steps.
export const frames = (attr: string, values: (string | number)[], dur: number, loop = true) =>
  `<animate attributeName="${attr}" values="${values.join(';')}" dur="${dur}s" calcMode="discrete" ${ending(loop)}/>`

export const moves = (values: string[], dur: number, loop = true) =>
  `<animateTransform attributeName="transform" type="translate" values="${values.join(';')}" dur="${dur}s" calcMode="discrete" ${ending(loop)}/>`

export const padded = (values: string[], length: number) => [
  ...values,
  ...Array<string>(Math.max(0, length - values.length)).fill('0 0'),
]

export const svg = (width: number, height: number, inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width * SCALE}" height="${height * SCALE}" shape-rendering="crispEdges">${inner}</svg>`

export const shadow = (x: number, y: number, width: number) =>
  `<rect x="${x}" y="${y}" width="${width}" height="1" fill="${SHADOW}" opacity=".3"/>`

export function eyes(xs: number[], mode: Eyes): string {
  const y = mode === 'tired' ? 3 : 2
  const h = mode === 'tired' ? 1 : 2
  const blink = mode === 'open' ? '' : frames('height', [...Array<number>(14).fill(h), 0], 4.5)

  return `<g fill="${EYE}">${xs.map(x => rect(x, y, 1, h, blink)).join('')}</g>`
}

const sweat = (x: number, period: number) =>
  `<g fill="${SWEAT}">${rect(
    x,
    0,
    1,
    2,
    frames('opacity', [0, 0, 0, 0, 0, 1, 1, 1, 0], period) +
      frames('y', [0, 0, 0, 0, 0, 0, 1, 2, 2], period),
  )}</g>`

export const sweatFor = (level: ClawdLevel, x: number) =>
  level === 'warn' ? sweat(x, 3.2) : level === 'over' ? sweat(x, 1.8) : ''

export const bang = (x: number, fill: string) =>
  `<g fill="${fill}" opacity="0">${frames('opacity', [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0], ALERT_SECONDS, false)}${rect(x, 1, 1, 3)}${rect(x, 5, 1, 1)}</g>`

// The body flashes between the old and new color, then keeps the new one.
export const flash = (from: string, to: string) => frames('fill', [from, to, from, to, to, to], 1.2, false)

export const JUMP = padded(
  ['0 0', '0 -2', '0 -3', '0 -4', '0 -4', '0 -3', '0 -2', '0 0', '0 0', '0 -2', '0 -3', '0 -3', '0 -2'],
  24,
)
export const SHAKE = padded(['-1 0', '1 0', '-1 0', '1 0', '-1 0', '1 0', '-1 0', '1 0', '-1 0', '1 0'], 24)
