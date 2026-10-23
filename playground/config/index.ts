import type { NuxtConfConfigObject, NuxtConfValue } from '../../src/types'

export interface IEnvConfig extends NuxtConfConfigObject {
  NUXT_APP_ENV: 'development' | 'ft' | 'production'
  NUXT_APP_BASE_API: string
  proxy?: {
    options: unknown
  }
  multiCache?: NuxtConfValue<{
    routeCache?: boolean
    componentCache?: boolean
    apiAuthorization?: string
    debug?: boolean
  }>
}
