import { isPlainObject } from 'lodash-es'
import type { NuxtConfConfigObject } from '../types'

export const getPublicConfig = (config: NuxtConfConfigObject<Record<string, any>>) => {
  const publicConfig: NuxtConfConfigObject<Record<string, any>> = {}

  for (const [key, value] of Object.entries(config)) {
    if (!isPlainObject(value) || value.private !== true) {
      publicConfig[key] = value
    }
  }

  return publicConfig
}
