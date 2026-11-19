import { mkdtempSync, rmdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadConfigSnapshot, loadSentryRelease } from '../src/runtime/version'

const fileName = 'version.json'
let rootDir: string

beforeEach(() => {
  rootDir = mkdtempSync(join(tmpdir(), 'nuxt-conf-version-'))
})

afterEach(() => {
  rmSync(join(rootDir, fileName), { force: true })
  rmdirSync(rootDir)
})

describe('loadConfigSnapshot', () => {
  it('returns the config from the version file', () => {
    const config = { enumKey: 'bar', nested: { enabled: true } }
    writeFileSync(join(rootDir, fileName), JSON.stringify({ version: 'test-version', config }))

    expect(loadConfigSnapshot(fileName, { rootDir })).toStrictEqual(config)
  })

  it('returns an empty object when the file does not exist', () => {
    expect(loadConfigSnapshot(fileName, { rootDir })).toStrictEqual({})
  })

  it('returns an empty object when the file contains invalid JSON', () => {
    writeFileSync(join(rootDir, fileName), '{"version":')

    expect(loadConfigSnapshot(fileName, { rootDir })).toStrictEqual({})
  })

  it('returns an empty object when the file does not contain config', () => {
    writeFileSync(join(rootDir, fileName), JSON.stringify({ version: 'test-version' }))

    expect(loadConfigSnapshot(fileName, { rootDir })).toStrictEqual({})
  })
})

describe('loadSentryRelease', () => {
  it('returns the Sentry release from the version file', () => {
    const sentryRelease = 'example@1.2.3'
    writeFileSync(join(rootDir, fileName), JSON.stringify({ version: 'test-version', sentryRelease }))

    expect(loadSentryRelease(fileName, { rootDir })).toBe(sentryRelease)
  })

  it('returns undefined when the file does not exist', () => {
    expect(loadSentryRelease(fileName, { rootDir })).toBeUndefined()
  })

  it('returns undefined when the file contains invalid JSON', () => {
    writeFileSync(join(rootDir, fileName), '{"version":')

    expect(loadSentryRelease(fileName, { rootDir })).toBeUndefined()
  })

  it('returns undefined when the file does not contain sentryRelease', () => {
    writeFileSync(join(rootDir, fileName), JSON.stringify({ version: 'test-version' }))

    expect(loadSentryRelease(fileName, { rootDir })).toBeUndefined()
  })

  it('returns undefined when sentryRelease is not a string', () => {
    writeFileSync(join(rootDir, fileName), JSON.stringify({ version: 'test-version', sentryRelease: 123 }))

    expect(loadSentryRelease(fileName, { rootDir })).toBeUndefined()
  })
})
