import { describe, expect, it } from 'vitest'
import { resolveCdnUrl } from '../src/cdn/resolve'

describe('resolveCdnUrl', () => {
  it('generates a version without a CDN base URL', () => {
    const config: Record<string, any> = {}

    expect(resolveCdnUrl(config, '.', false)).toBeUndefined()
    expect(config.NUXT_APP_CDN_VERSION).toMatch(/^[a-z0-9_-]{10}$/)
  })

  it('keeps an existing CDN URL when only the version is missing', () => {
    const config: Record<string, any> = {
      NUXT_APP_CDN_URL: 'https://cdn.example.com/assets/',
    }

    expect(resolveCdnUrl(config, '.', false)).toBe('https://cdn.example.com/assets/')
    expect(config.NUXT_APP_CDN_VERSION).toMatch(/^[a-z0-9_-]{10}$/)
  })
})
