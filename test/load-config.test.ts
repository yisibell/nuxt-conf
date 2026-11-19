import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadEnvironmentConfig } from '../src/config/load'

describe('loadEnvironmentConfig', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('loads the default environment when the requested environment has no layers', async () => {
    vi.stubEnv('NUXT_CONF_TEST_ENV', 'unavailable')
    const loaded = await loadEnvironmentConfig({
      rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
      configDir: 'config/env',
      envVariable: 'NUXT_CONF_TEST_ENV',
      defaultEnv: 'development',
    })

    expect(loaded.config).toMatchObject({ NUXT_APP_ENV: 'development' })
    expect(loaded.configFiles).toHaveLength(1)
    expect(loaded.configFiles[0]).toMatch(/env\.development\.ts$/)
    expect(loaded.configTypeFile).toBeUndefined()
  })

  it('finds the contract in configDir and does not load it as an environment layer', async () => {
    vi.stubEnv('NUXT_CONF_TEST_ENV', 'types')
    const loaded = await loadEnvironmentConfig({
      rootDir: fileURLToPath(new URL('./fixtures/config-types', import.meta.url)),
      configDir: 'settings/env',
      envVariable: 'NUXT_CONF_TEST_ENV',
      defaultEnv: 'development',
    })

    expect(loaded.config).toEqual({ enumKey: 'foo' })
    expect(loaded.configFiles).toHaveLength(1)
    expect(loaded.configTypeFile).toBe(fileURLToPath(new URL('./fixtures/config-types/settings/env/env.types.ts', import.meta.url)).replaceAll('\\', '/'))
  })
})
