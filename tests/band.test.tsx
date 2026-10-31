import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

const BAND = {
  plugin: 'context-clawd',
  component: 'AbovePrompt',
  requestId: 'band',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 100,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

// Only the alert sprite holds one-shot frames; idle and working ones loop.
const ONE_SHOT = 'fill="freeze"'
const SET_VIEWS = ['viewBox="0 0 28 16"', 'viewBox="0 0 30 18"']

// Stands for the engine: a 1M window whose usage the test moves by hand.
function engine(on: On) {
  const usage = { tokens: undefined as number | undefined }

  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.usage', () => ({
    value: {
      startedAt: 0,
      context: { tokens: usage.tokens, window: 1_000_000 },
      rateLimits: [],
    },
  }))

  return { usage, clock: mock.clock(on) }
}

const start = ($: Engine) => $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

async function sprite($: Engine): Promise<string> {
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const svg = await ui.find({ type: 'Svg' })
  await ui.unmount()

  return String(svg?.props.source)
}

test('a new session shows the fresh band on both surfaces', async ($, on) => {
  engine(on)
  await start($)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })

    expect(await ui.find({ type: 'Text', text: /new context/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /— \/ 1M/ })).toBeDefined()
    await ui.unmount()
  }
})

test('the session keeps the set it drew through reloads', async ($, on) => {
  engine(on)
  await start($)

  const first = await sprite($)
  const view = SET_VIEWS.find(v => first.includes(v))
  expect(view).toBeDefined()

  // A hot reload runs session.start again; the drawn set stays.
  for (let i = 0; i < 5; i += 1) {
    await start($)
    expect(await sprite($)).toContain(view ?? '')
  }
})

test('crossing 300k plays the alert once, then settles on yellow', async ($, on) => {
  const { usage, clock } = engine(on)

  await start($)
  usage.tokens = 120_000
  await clock.advance(1500)
  expect(await sprite($)).not.toContain(ONE_SHOT)

  usage.tokens = 301_000
  await clock.advance(1500)
  expect(await sprite($)).toContain(ONE_SHOT)
  expect(await sprite($)).toContain('#EDB436')

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /301k \/ 1M · 30%/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /filling up/ })).toBeDefined()
  await ui.unmount()

  await clock.advance(2600)
  expect(await sprite($)).not.toContain(ONE_SHOT)
})

test('past 500k the band turns red', async ($, on) => {
  const { usage, clock } = engine(on)

  await start($)
  usage.tokens = 400_000
  await clock.advance(1500)
  usage.tokens = 520_000
  await clock.advance(1500)
  expect(await sprite($)).toContain(ONE_SHOT)

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const status = await ui.find({ type: 'Text', text: /^\s+past the line$/ })
  expect(status?.props.color).toBe('#E5484D')
  await ui.unmount()
})

test('a session resumed above 300k shows yellow without the alert', async ($, on) => {
  const { usage } = engine(on)

  usage.tokens = 350_000
  await start($)
  expect(await sprite($)).not.toContain(ONE_SHOT)

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /filling up/ })).toBeDefined()
  await ui.unmount()
})
