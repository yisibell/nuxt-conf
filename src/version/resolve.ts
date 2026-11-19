import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { NuxtConfConfigObject } from '../types'
import { getPublicConfig } from '../config/public'

/** Options for writing a generated version file. */
export interface WriteVersionFileOptions {
  rootDir: string
  versionFileName?: string
  sentryRelease?: string
  config?: NuxtConfConfigObject<Record<string, any>>
  includePrivateConfig?: boolean
}

/**
 * Writes the build version and optional Sentry release to a JSON file.
 *
 * @param version Build version to write.
 * @param options Write options.
 * @param options.rootDir Project root directory.
 * @param options.versionFileName Target file path relative to `rootDir`.
 * @param options.sentryRelease Optional Sentry release to include.
 * @param options.config Optional resolved configuration to include under `config`.
 * @param options.includePrivateConfig Whether to include top-level private config entries.
 */
export const writeVersionFile = (
  version: string,
  {
    rootDir,
    versionFileName = 'version.json',
    sentryRelease,
    config,
    includePrivateConfig = false,
  }: WriteVersionFileOptions,
) => {
  const versionPath = resolve(rootDir, versionFileName)

  mkdirSync(dirname(versionPath), { recursive: true })
  writeFileSync(
    versionPath,
    JSON.stringify({
      version,
      ...(sentryRelease ? { sentryRelease } : {}),
      ...(config ? { config: includePrivateConfig ? config : getPublicConfig(config) } : {}),
    }),
  )
}
