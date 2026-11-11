import { describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { resolveCdnUrl } from '../src/cdn/resolve'
import { loadVersionFile, writeVersionFile } from '../src/version/resolve'

describe('resolveCdnUrl', () => {
  it('generates a version without a CDN base URL', () => {
    const config: Record<string, any> = {}

    const resolved = resolveCdnUrl(config, 'generated-version')

    expect(resolved.cdnUrl).toBeUndefined()
    expect(resolved.version).toBe('generated-version')
    expect(config).toEqual({})
  })

  it('keeps an existing CDN URL when only the version is missing', () => {
    const config: Record<string, any> = {
      NUXT_APP_CDN_URL: 'https://cdn.example.com/assets/',
    }

    const resolved = resolveCdnUrl(config, 'generated-version')

    expect(resolved.cdnUrl).toBe('https://cdn.example.com/assets/')
    expect(resolved.version).toBe('generated-version')
    expect(config).toEqual({
      NUXT_APP_CDN_URL: 'https://cdn.example.com/assets/',
    })
  })

  it('reuses a configured version without mutating the config', () => {
    const config = {
      NUXT_APP_CDN_BASE_URL: 'https://cdn.example.com/assets',
      NUXT_APP_CDN_VERSION: 'fixed-version',
    }

    expect(resolveCdnUrl(config, 'generated-version')).toEqual({
      version: 'fixed-version',
      cdnUrl: 'https://cdn.example.com/assets/fixed-version/',
    })
    expect(config).toEqual({
      NUXT_APP_CDN_BASE_URL: 'https://cdn.example.com/assets',
      NUXT_APP_CDN_VERSION: 'fixed-version',
    })
  })

  it('writes a configured version to the version file', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'nuxt-conf-'))

    try {
      writeVersionFile('fixed-version', {
        rootDir,
      })

      expect(JSON.parse(readFileSync(join(rootDir, 'version.json'), 'utf8'))).toEqual({
        version: 'fixed-version',
      })
    }
    finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('writes the Sentry release to the version file when provided', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'nuxt-conf-'))

    try {
      writeVersionFile('fixed-version', {
        rootDir,
        versionFileName: 'version.json',
        sentryRelease: 'project@2026.11.12+123',
      })

      expect(JSON.parse(readFileSync(join(rootDir, 'version.json'), 'utf8'))).toEqual({
        version: 'fixed-version',
        sentryRelease: 'project@2026.11.12+123',
      })
    }
    finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('loads the complete version file object', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'nuxt-conf-'))

    try {
      writeVersionFile('fixed-version', {
        rootDir,
        sentryRelease: 'project@2026.11.12+123',
      })

      expect(loadVersionFile('version.json', { rootDir })).toEqual({
        version: 'fixed-version',
        sentryRelease: 'project@2026.11.12+123',
      })
    }
    finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('creates parent directories for a custom version file path', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'nuxt-conf-'))

    try {
      writeVersionFile('fixed-version', {
        rootDir,
        versionFileName: 'meta/build/version.json',
      })

      expect(loadVersionFile('meta/build/version.json', { rootDir })).toEqual({
        version: 'fixed-version',
      })
    }
    finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
