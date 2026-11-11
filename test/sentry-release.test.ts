import { describe, expect, it } from 'vitest'
import { createSentryRelease, formatSentryReleaseDate } from '../src/sentry/release'

describe('sentry release', () => {
  it('uses the CDN version in cdn-version mode', () => {
    expect(createSentryRelease('cdn-version', {
      cdnVersion: 'cdn-hash',
      projectName: 'project',
      timestamp: 0,
    })).toBe('cdn-hash')
  })

  it('creates a dated release with the build timestamp', () => {
    const timestamp = Date.UTC(2026, 10, 12) + 123

    expect(formatSentryReleaseDate(timestamp)).toBe('2026.11.12')
    expect(createSentryRelease('sentry-release', {
      cdnVersion: 'cdn-hash',
      projectName: 'project',
      timestamp,
    }))
      .toBe(`project@2026.11.12+${timestamp}`)
  })
})
