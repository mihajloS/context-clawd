// The first set: Claude's mascot from the front, marching while it works.

import type { ClawdLevel } from '../types'
import {
  ALERT_SECONDS,
  COLOR,
  JUMP,
  SHAKE,
  bang,
  eyes,
  flash,
  frames,
  moves,
  rect,
  shadow,
  svg,
  sweatFor,
} from './pixels'
import type { Eyes, Scene, SpriteSet } from './pixels'

const WIDTH = 28
const HEIGHT = 16
const AT = 'translate(1 5)'
const GROUND = shadow(5, 15, 10)

// A 12x8 body, arms out at the middle row, four legs, two tall eyes.
function figure(fill: string, look: Eyes, o: { march?: boolean; recolor?: string } = {}): string {
  const arm = (x: number, phase: number) =>
    rect(x, 4, 2, 2, o.march ? frames('y', phase ? [3, 4] : [4, 3], 0.5) : '')
  const leg = (x: number, phase: number) =>
    rect(x, 8, 1, 2, o.march ? frames('height', phase ? [1, 2] : [2, 1], 0.5) : '')

  return (
    `<g fill="${fill}">${o.recolor ?? ''}` +
    rect(3, 0, 12, 8) +
    arm(1, 0) +
    arm(15, 1) +
    leg(4, 0) +
    leg(6, 1) +
    leg(11, 0) +
    leg(13, 1) +
    `</g>` +
    eyes([5, 12], look)
  )
}

// The ✻ of Claude Code's spinner, as four pixel frames: plus, dot, cross, dot.
const PLUS = [rect(24, 2, 1, 5), rect(22, 4, 5, 1)]
const DOT = [rect(24, 3, 1, 3), rect(23, 4, 3, 1)]
const CROSS = [
  [22, 2],
  [23, 3],
  [24, 4],
  [25, 5],
  [26, 6],
  [26, 2],
  [25, 3],
  [23, 5],
  [22, 6],
].map(([x = 0, y = 0]) => rect(x, y, 1, 1))

function sparkle(fill: string): string {
  const shape = (parts: string[], slot: number) =>
    `<g opacity="0">${frames('opacity', [0, 1, 2, 3].map(i => (i === slot ? 1 : 0)), 0.8)}${parts.join('')}</g>`

  return `<g fill="${fill}">${shape(PLUS, 0)}${shape(DOT, 1)}${shape(CROSS, 2)}${shape(DOT, 3)}</g>`
}

const BOB_SECONDS: Record<ClawdLevel, number> = { fresh: 1.6, ok: 1.6, warn: 1.1, over: 2.4 }

function draw(scene: Scene): string {
  if (scene.kind === 'alert') {
    const from = COLOR[scene.from]
    const to = COLOR[scene.to]
    const isOver = scene.to === 'over'
    const body = figure(from, 'open', { recolor: flash(from, to) })
    const marks = isOver ? bang(20, to) + bang(22, to) : bang(21, to)

    return svg(
      WIDTH,
      HEIGHT,
      GROUND +
        `<g transform="${AT}"><g>${moves(isOver ? SHAKE : JUMP, ALERT_SECONDS, false)}${body}</g></g>` +
        marks,
    )
  }

  const color = COLOR[scene.level]

  if (scene.kind === 'working') {
    return svg(
      WIDTH,
      HEIGHT,
      GROUND +
        `<g transform="${AT}">${figure(color, 'blink', { march: true })}${sweatFor(scene.level, 15)}</g>` +
        sparkle(color),
    )
  }

  const look = scene.level === 'over' ? 'tired' : 'blink'

  return svg(
    WIDTH,
    HEIGHT,
    GROUND +
      `<g transform="${AT}"><g>${moves(['0 0', '0 -1'], BOB_SECONDS[scene.level])}` +
      `${figure(color, look)}${sweatFor(scene.level, 15)}</g></g>`,
  )
}

export const classic: SpriteSet = { width: WIDTH, height: HEIGHT, draw }
