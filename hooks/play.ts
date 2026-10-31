// The second set: Claude from the side, facing right. It types on a laptop while
// it works and does keep-ups with a ball while idle (two kicks, then a header).

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

const WIDTH = 30
const HEIGHT = 18
// Local (0, 0) is the body's top-left corner; the ground is local y 10.
const AT = 'translate(5 7)'
const GROUND = shadow(5, 17, 10)

const DESK = '#9C7A5B'
const LAPTOP = '#8B9099'
const SCREEN = '#A5E8FF'
const BALL_LIGHT = '#FFFFFF'
const BALL_DARK = '#2A2A2A'

// Where the ball's top-left corner is on each 1/24 of a loop.
const BALL_PATH = [
  '12 5', '12 1', '12 -2', '12 -4', '12 -5', '12 -4', '12 -2', '12 1',
  '12 5', '11 1', '9 -2', '7 -5', '5 -6', '4 -4', '4 -6', '6 -7',
  '8 -6', '11 -4', '12 -1', '12 2', '12 5', '12 2', '12 1', '12 3',
]
const KICKS = new Set([0, 8, 20])
const HEADER = new Set([12, 13])
const HOP = BALL_PATH.map((_, i) => (HEADER.has(i) ? '0 -1' : '0 0'))
const TYPING = ['0 0', '0 -1', '0 0', '0 -1', '0 0', '0 0', '0 -1', '0 0']

const RISE = ['0 0', '0 -1', '0 -2', '0 -3', '0 -4', '0 -5']
const FADE = [1, 1, 0.8, 0.6, 0.3, 0]
const rotate = <T>(xs: T[], n: number) => [...xs.slice(n), ...xs.slice(0, n)]

// The body: a 10x8 block, the back arm a nub, both eyes toward the front, four legs.
function figure(
  fill: string,
  look: Eyes,
  o: { arm?: string; kickSeconds?: number; recolor?: string } = {},
): string {
  const frontLeg = o.kickSeconds
    ? rect(8, 8, 1, 2, frames('opacity', BALL_PATH.map((_, i) => (KICKS.has(i) ? 0 : 1)), o.kickSeconds)) +
      `<g opacity="0">${frames('opacity', BALL_PATH.map((_, i) => (KICKS.has(i) ? 1 : 0)), o.kickSeconds)}` +
      `${rect(8, 8, 1, 1)}${rect(9, 7, 3, 1)}</g>`
    : rect(8, 8, 1, 2)

  return (
    `<g fill="${fill}">${o.recolor ?? ''}` +
    rect(0, 0, 10, 8) +
    rect(-2, 4, 2, 2) +
    (o.arm ?? rect(10, 4, 2, 2)) +
    rect(1, 8, 1, 2) +
    rect(3, 8, 1, 2) +
    rect(6, 8, 1, 2) +
    frontLeg +
    `</g>` +
    eyes([5, 8], look)
  )
}

// The front arm laid on the keys, tapping at an uneven rhythm.
const typingArm = `<g>${moves(TYPING, 0.8)}${rect(10, 4, 4, 1)}</g>`

// A desk at arm height, the laptop on it with its lid toward Claude.
const laptop =
  `<g fill="${DESK}">${rect(11, 6, 11, 1)}${rect(12, 7, 1, 3)}${rect(20, 7, 1, 3)}</g>` +
  `<g fill="${LAPTOP}">${rect(13, 5, 6, 1)}${rect(19, 3, 1, 3)}${rect(20, 0, 1, 3)}${rect(21, -1, 1, 1)}</g>` +
  `<g fill="${SCREEN}">${frames('opacity', [1, 0.7, 1, 0.85, 1, 0.6], 0.9)}${rect(18, 3, 1, 2)}${rect(19, 0, 1, 3)}</g>`

// Bits of code drifting up out of the screen.
const bit = (x: number, y: number, fill: string, shift: number) =>
  `<g fill="${fill}">${moves(rotate(RISE, shift), 1.2)}${frames('opacity', rotate(FADE, shift), 1.2)}${rect(x, y, 2, 1)}</g>`

// A 3x3 checkered ball.
const ball = (seconds: number) =>
  `<g>${moves(BALL_PATH, seconds)}<g fill="${BALL_LIGHT}">${rect(0, 0, 3, 3)}</g>` +
  `<g fill="${BALL_DARK}">${rect(1, 0, 1, 1)}${rect(0, 1, 1, 1)}${rect(2, 1, 1, 1)}${rect(1, 2, 1, 1)}</g></g>`

function draw(scene: Scene): string {
  if (scene.kind === 'alert') {
    const from = COLOR[scene.from]
    const to = COLOR[scene.to]
    const isOver = scene.to === 'over'
    const body = figure(from, 'open', { recolor: flash(from, to) })
    const marks = isOver ? bang(18, to) + bang(20, to) : bang(19, to)

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
        `<g transform="${AT}">${figure(color, 'blink', { arm: typingArm })}${laptop}` +
        `${bit(15, -1, color, 0)}${bit(17, -2, color, 3)}${sweatFor(scene.level, -1)}</g>`,
    )
  }

  // Tired past the red line: slower keep-ups and half-shut eyes.
  const seconds = scene.level === 'over' ? 3.6 : 2.4
  const look = scene.level === 'over' ? 'tired' : 'blink'

  return svg(
    WIDTH,
    HEIGHT,
    GROUND +
      `<g transform="${AT}"><g>${moves(HOP, seconds)}${figure(color, look, { kickSeconds: seconds })}` +
      `${sweatFor(scene.level, -1)}</g>${ball(seconds)}</g>`,
  )
}

export const play: SpriteSet = { width: WIDTH, height: HEIGHT, draw }
