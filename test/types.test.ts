import { describe, expect, it } from 'vitest'
import { createConfigTypes } from '../src/types/template'

describe('generated config types', () => {
  it('keeps the Sentry release runtime type when runtime config injection is disabled', () => {
    const generated = createConfigTypes(
      'config/env/env.development.ts',
      {
        buildDir: '.nuxt',
        injectRuntimeConfig: false,
      },
    )

    expect(generated).toContain('interface RuntimeConfig extends NuxtConfPublicConfig')
    expect(generated).toContain('NUXT_APP_SENTRY_RELEASE?: string')
  })
})
