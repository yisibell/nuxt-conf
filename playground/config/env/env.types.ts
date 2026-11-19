import type { NuxtConfValue } from '../../../src/types'

export interface NuxtConfEnvConfig {
  NUXT_APP_ENV: 'development' | 'ft' | 'production'
  NUXT_APP_BASE_API: string
  NUXT_APP_CDN_BASE_URL?: string
  proxy?: {
    options?: unknown
  }
  multiCache?: NuxtConfValue<{
    routeCache?: boolean
    componentCache?: boolean
    apiAuthorization?: string
    debug?: boolean
  }>

  enumKey?: 'foo' | 'bar'
}
