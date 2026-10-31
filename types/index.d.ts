// fresh: no reply measured yet in this context (new session, after /clear or a compaction)
export type ClawdLevel = 'fresh' | 'ok' | 'warn' | 'over'

export type ClawdReading = {
  tokens: number | null
  window: number
  level: ClawdLevel
}

// The one-shot animation played when the level rises into warn or over.
export type ClawdAlert = { id: number; from: ClawdLevel; to: 'warn' | 'over' } | null

// Which sprite set draws the band, picked at random once per session.
export type ClawdSetId = 'classic' | 'play'

declare module 'claude-code' {
  interface PluginState {
    'context-clawd': { reading: ClawdReading; alert: ClawdAlert; set: ClawdSetId }
  }
}
