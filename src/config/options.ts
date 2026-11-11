import { defu } from 'defu'
import { get, isPlainObject, set } from 'lodash-es'
import type { NuxtConfConfigObject, NuxtConfModuleOptions } from '../types'

/** Options for applying source configuration values to target options. */
export interface ApplyNuxtOptionsOptions {
  target: object
  mappings?: NuxtConfModuleOptions['nuxtOptions']
}

/**
 * Applies environment config values to Nuxt or other module options.
 *
 * Existing target values take precedence unless a mapping explicitly enables
 * `override`; plain objects are merged with `defu` when both sides are objects.
 *
 * @param config Loaded environment configuration.
 * @param options Mapping options and the target options object.
 * @param options.target Target Nuxt or module options object.
 * @param options.mappings Source-to-target mappings.
 */
export const applyNuxtOptions = (
  config: NuxtConfConfigObject,
  { target, mappings = {} }: ApplyNuxtOptionsOptions,
) => {
  for (const [targetPath, mapping] of Object.entries(mappings)) {
    const sourcePath = typeof mapping === 'string' ? mapping : mapping.from
    const override = typeof mapping === 'string' ? false : mapping.override === true
    const value = get(config, sourcePath)
    const currentValue = get(target, targetPath)

    if (value === undefined) {
      continue
    }

    if (override || currentValue === undefined) {
      set(target, targetPath, value)
    }
    else if (isPlainObject(currentValue) && isPlainObject(value)) {
      set(target, targetPath, defu(currentValue, value))
    }
  }
}
