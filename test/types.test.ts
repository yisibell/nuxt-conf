import { describe, expect, expectTypeOf, it } from 'vitest'
import { createConfigTypes } from '../src/types/template'
import type { NuxtConfMerge } from '../src/runtime/core'
import type { NuxtConfConfigObject } from '../src/types'

interface UserEnvironmentConfig extends NuxtConfConfigObject {
  enumKey: 'foo' | 'bar'
}

type ResolvedLayers = NuxtConfMerge<
  { mode: 'production', nested: { url: '/production' }, list: ['production'] },
  { mode: 'default', nested: { url: '/default', timeout: 3000 }, list: ['default'], fallback: true }
>

describe('generated config types', () => {
  it('uses the named contract instead of inferring types from the layers', () => {
    const generated = createConfigTypes(['settings/env.development.ts'], {
      buildDir: '.nuxt',
      configTypeFile: 'settings/env.types.ts',
    })

    expect(generated).toContain('import type { NuxtConfEnvConfig } from "../settings/env.types"')
    expect(generated).toContain('type NuxtConfResolvedConfig = NuxtConfKnownFields<NuxtConfEnvConfig>')
    expect(generated).not.toContain('NuxtConfMerge')
    expect(generated).not.toContain('env.development')
  })

  it('keeps the Sentry release runtime type when runtime config injection is disabled', () => {
    const generated = createConfigTypes(
      'config/env/env.development.ts',
      {
        buildDir: '.nuxt',
        runtimeConfigKeys: ['NUXT_APP_SENTRY_RELEASE'],
      },
    )

    expect(generated).toContain('interface RuntimeConfig extends NuxtConfRuntimeConfig')
    expect(generated).toContain('keyof NuxtConfRuntimeFields, "NUXT_APP_SENTRY_RELEASE"')
    expect(generated).toContain('NUXT_APP_SENTRY_RELEASE?: string')
  })

  it('merges layered config types by precedence instead of intersecting them', () => {
    const generated = createConfigTypes(
      ['config/env/env.production.local.ts', 'config/env/env.production.ts', 'config/env/env.default.ts'],
      { buildDir: '.nuxt' },
    )

    expect(generated).toContain('import type { NuxtConfMerge } from \'nuxt-conf/core\'')
    expect(generated).not.toContain('type NuxtConfMerge<High, Low>')
    expect(generated).toContain(
      'type NuxtConfResolvedConfig = NuxtConfMerge<NuxtConfMerge<NuxtConfMerge<Record<never, never>, '
      + 'typeof import("../config/env/env.production.local").default>, '
      + 'typeof import("../config/env/env.production").default>, typeof import("../config/env/env.default").default>',
    )
    expect(generated).toContain('interface CustomAppConfig extends NuxtConfPublicConfig')
    expect(generated).not.toContain('interface RuntimeConfig extends')
    expect(generated).not.toContain('type NuxtConfResolvedConfig = typeof import(')
    expect(generated).not.toContain(').default & typeof import(')
  })

  it('resolves conflicting and nested config field types in priority order', () => {
    expectTypeOf<ResolvedLayers>().toEqualTypeOf<{
      mode: 'production'
      nested: { url: '/production', timeout: 3000 }
      list: ['production', 'default']
      fallback: true
    }>()
  })

  it('falls back on nullish values and preserves the order of mixed layers', () => {
    type High = { mode?: 'override', region: null, nested: { high: true } }
    type Middle = { mode: 'default', region: 'west', nested: false }
    type Low = { nested: { low: true } }
    type Resolved = NuxtConfMerge<NuxtConfMerge<High, Middle>, Low>
    expectTypeOf<Resolved>().toEqualTypeOf<{
      mode: 'override' | 'default'
      region: 'west'
      nested: { high: true, low: true }
    }>()
  })

  it('preserves explicit keys and enum unions on NuxtConfConfigObject extensions', () => {
    type Resolved = NuxtConfMerge<UserEnvironmentConfig, Record<never, never>>
    expectTypeOf<Resolved['enumKey']>().toEqualTypeOf<'foo' | 'bar'>()
  })

  it('accepts custom keys on the public config type as in v3', () => {
    const config = { customValue: 'legacy' } satisfies NuxtConfConfigObject
    const typedConfig: NuxtConfConfigObject<{ name: string }> = { name: 'legacy', customValue: 'legacy' }
    expect(typedConfig.customValue).toBe(config.customValue)
  })
})
