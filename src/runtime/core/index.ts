import { defu } from 'defu'

export type { NuxtConfKnownFields, NuxtConfMerge } from './types'

/**
 * Merges configuration layers for an environment with `defu`. Earlier layers take precedence.
 *
 * For `production`, the order is `production.local`, `local`, `production`,
 * `production.default`, then `default`.
 *
 * @param env Environment name, such as `production`.
 * @param configs Configurations keyed by environment and optional `local`/`default` suffixes.
 * @returns The merged configuration, or an empty object when no layers are provided.
 */
export const mergeEnvConfig = <T extends Record<string, any>>(
  env: string,
  configs: Record<string, T | undefined>,
): T => {
  const layers = [
    configs[`${env}.local`],
    configs.local,
    configs[env],
    configs[`${env}.default`],
    configs.default,
  ].filter((config): config is T => config !== undefined)

  // `defu` requires a first argument; the empty object also handles no layers.
  return defu(layers[0] ?? {}, ...layers.slice(1)) as T
}
