// The band's art: the context levels, the sprite sets and the segmented bar.

import type { ClawdLevel, ClawdSetId } from '../types'
import { classic } from './classic'
import { play } from './play'
import { COLOR } from './pixels'
import type { SpriteSet } from './pixels'

export { COLOR, SCALE } from './pixels'
export type { Scene } from './pixels'

// Shares of the context window: 300k and 500k on a 1M window.
export const WARN_AT = 0.3
export const OVER_AT = 0.5

export const SETS: Record<ClawdSetId, SpriteSet> = { classic, play }
export const SET_ORDER: ClawdSetId[] = ['classic', 'play']

export const BAR_WIDTH = 199
export const BAR_HEIGHT = 7

const SEGMENTS = 40

export function levelOf(tokens: number | null, window: number): ClawdLevel {
  if (tokens === null || window <= 0) return 'fresh'
  const share = tokens / window
  if (share > OVER_AT) return 'over'
  if (share >= WARN_AT) return 'warn'
  return 'ok'
}

// 40 segments over the whole window, tinted by the zone each one sits in.
export function barSvg(tokens: number | null, window: number): string {
  const share = tokens === null || window <= 0 ? 0 : tokens / window
  const filled = Math.min(SEGMENTS, Math.ceil(share * SEGMENTS))
  const cells = Array.from({ length: SEGMENTS }, (_, i) => {
    const color = COLOR[levelOf(i + 0.5, SEGMENTS)]
    const dim = i < filled ? '' : ' opacity=".22"'

    return `<rect x="${i * 5}" y="0" width="4" height="${BAR_HEIGHT}" fill="${color}"${dim}/>`
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BAR_WIDTH} ${BAR_HEIGHT}" width="${BAR_WIDTH}" height="${BAR_HEIGHT}" shape-rendering="crispEdges">${cells.join('')}</svg>`
}
