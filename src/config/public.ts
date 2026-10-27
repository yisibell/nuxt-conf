import { isPlainObject } from 'lodash-es'
import type { NuxtConfConfigObject } from '../types'

export const getPublicConfig = (config: NuxtConfConfigObject) => {
  const publicConfig: NuxtConfConfigObject = {}

  for (const [key, value] of Object.entries(config)) {
    if (!isPlainObject(value) || value.private !== true) {
      publicConfig[key] = value
    }
  }

  return publicConfig
}
