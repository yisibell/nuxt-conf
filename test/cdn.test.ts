import { describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { resolveCdnUrl, writeCdnVersionFile } from '../src/cdn/resolve'

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
      writeCdnVersionFile(rootDir, 'fixed-version')

      expect(JSON.parse(readFileSync(join(rootDir, 'version.json'), 'utf8'))).toEqual({
        version: 'fixed-version',
      })
    }
    finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
