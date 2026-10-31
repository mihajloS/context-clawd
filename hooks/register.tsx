import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { ClawdAlert, ClawdLevel, ClawdReading, ClawdSetId } from '../types'
import { BAR_HEIGHT, BAR_WIDTH, COLOR, SCALE, SETS, SET_ORDER, barSvg, levelOf } from './art'
import type { Scene } from './art'

const FIRST: ClawdReading = { tokens: null, window: 0, level: 'fresh' }
const NO_ALERT: ClawdAlert = null
const FIRST_SET: ClawdSetId = 'classic'
const SET = { plugin: 'context-clawd', key: 'set' } as const

const reading = atom({ plugin: 'context-clawd', key: 'reading' } as const, FIRST)
const alert = atom({ plugin: 'context-clawd', key: 'alert' } as const, NO_ALERT)
const set = atom(SET, FIRST_SET)

// Each session draws one set at random. $.state outlives a hot reload, so a set
// already written (version above 0) stays for the rest of the session.
async function pickSet($: EngineInterface): Promise<void> {
  const { version } = await $.state.get(SET)

  if (version > 0) return

  const id = SET_ORDER[Math.floor(Math.random() * SET_ORDER.length)] ?? FIRST_SET
  await update($, set, () => id)
}

// Reading the usage without a breakdown is free: it is the last API response's numbers.
const POLL_MS = 1500
// A little longer than the 2.4s alert animation, so its last frame shows.
const ALERT_MS = 2600

const RANK: Record<ClawdLevel, number> = { fresh: 0, ok: 1, warn: 2, over: 3 }

const STATUS: Record<ClawdLevel, string> = {
  fresh: 'new context',
  ok: '',
  warn: 'filling up',
  over: 'past the line',
}

function formatTokens(n: number | null): string {
  if (n === null || n <= 0) return '—'
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(2)}M`
  if (n >= 10_000) return `${Math.round(n / 1000)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`

  return String(n)
}

async function refresh($: EngineInterface): Promise<void> {
  const { context } = await $.session.usage()
  const tokens = context.tokens ?? null
  const now: ClawdReading = {
    tokens,
    window: context.window,
    level: levelOf(tokens, context.window),
  }
  const was = await read($, reading)

  if (was.tokens === now.tokens && was.window === now.window) return

  await update($, reading, () => now)

  // The first reading of a session (window still 0) sets the level quietly.
  const hasRisen = was.window > 0 && RANK[now.level] > RANK[was.level]

  if (hasRisen && (now.level === 'warn' || now.level === 'over')) {
    const to = now.level
    const id = await $.clock.now()

    await update($, alert, () => ({ id, from: was.level, to }))
    $.clock.after(ALERT_MS, () => {
      update($, alert, a => (a?.id === id ? null : a)).catch(() => undefined)
    })
  } else if (RANK[now.level] < RANK[was.level]) {
    await update($, alert, () => null)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)

    await pickSet($).catch(() => undefined)
    await refresh($).catch(() => undefined)
    $.clock.every(POLL_MS, () => {
      refresh($).catch(() => undefined)
    })

    return started
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    const now = await read($, reading)
    const flash = await read($, alert)
    const color = COLOR[now.level]
    const status = STATUS[now.level]
    const share = now.tokens === null || now.window <= 0 ? null : now.tokens / now.window
    const label = `${formatTokens(now.tokens)} / ${formatTokens(now.window)}`
    const percent = share === null ? '' : ` · ${Math.round(share * 100)}%`

    if (e.surface === 'terminal') {
      const { Box, Text } = $.ui.resolve(e)
      const cells = 20
      const filled = Math.min(cells, Math.ceil((share ?? 0) * cells))
      const zone = (level: ClawdLevel, from: number, to: number) => {
        const lit = Math.max(0, Math.min(to, filled) - from)

        return (
          <Text color={COLOR[level]}>
            {'▰'.repeat(lit)}
            <Text dimColor>{'▱'.repeat(to - from - lit)}</Text>
          </Text>
        )
      }

      return (
        <Box flexDirection="row" gap={1}>
          <Text color={color}>▐▛███▜▌</Text>
          <Text>
            {label}
            {percent}
          </Text>
          <Text>
            {zone('ok', 0, 6)}
            {zone('warn', 6, 10)}
            {zone('over', 10, 20)}
          </Text>
          <Text color={color}>{status}</Text>
        </Box>
      )
    }

    const scene: Scene = flash
      ? { kind: 'alert', from: flash.from, to: flash.to }
      : now.level === 'fresh' || e.props.isWorking
        ? { kind: 'working', level: now.level }
        : { kind: 'idle', level: now.level }
    const sprite = SETS[await read($, set)]
    const { Box, Svg, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" alignItems="center" gap="sm">
        <Svg
          source={sprite.draw(scene)}
          alt={`Claude, ${status || 'context'}`}
          width={sprite.width * SCALE}
          height={sprite.height * SCALE}
          isInteractive
        />
        <Box flexDirection="column" gap="xs">
          <Text size="footnote" mono>
            <Text weight="semibold">{label}</Text>
            {percent}
            <Text color={color}>{status ? `   ${status}` : ''}</Text>
          </Text>
          <Svg
            source={barSvg(now.tokens, now.window)}
            alt={`Context ${label}${percent}`}
            width={BAR_WIDTH}
            height={BAR_HEIGHT}
          />
        </Box>
      </Box>
    )
  })
}
