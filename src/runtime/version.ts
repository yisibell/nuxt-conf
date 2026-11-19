import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export interface NuxtConfVersionFile {
  version: string
  sentryRelease?: string
  [key: string]: unknown
}

/** Options for resolving a version file relative to a project root. */
export interface LoadVersionFileOptions {
  rootDir: string
}

/**
 * Loads and parses a generated version file.
 *
 * @param versionFileName Version file path relative to `rootDir`.
 * @param options Resolution options.
 * @param options.rootDir Project root directory.
 * @returns The complete parsed version file object.
 * @throws If the file does not exist or does not contain a string `version`.
 */
export const loadVersionFile = (
  versionFileName: string,
  { rootDir }: LoadVersionFileOptions,
): NuxtConfVersionFile => {
  const versionPath = resolve(rootDir, versionFileName)

  if (!existsSync(versionPath)) {
    throw new Error(`Version file does not exist: ${versionPath}`)
  }

  const parsed = JSON.parse(readFileSync(versionPath, 'utf8')) as unknown

  if (!parsed || typeof parsed !== 'object' || typeof (parsed as { version?: unknown }).version !== 'string') {
    throw new Error(`Version file does not contain a valid version: ${versionPath}`)
  }

  return parsed as NuxtConfVersionFile
}

/**
 * Reads the `config` snapshot from a generated version file.
 *
 * @typeParam T Expected config shape. Its fields are not validated at runtime.
 * @param versionFileName Version file path relative to `rootDir`.
 * @param options Resolution options.
 * @param options.rootDir Project root directory.
 * @returns The stored config object, or an empty object if it cannot be loaded.
 */
export const loadConfigSnapshot = <T extends object = Record<string, unknown>>(
  versionFileName: string,
  options: LoadVersionFileOptions,
): Partial<T> => {
  try {
    const { config } = loadVersionFile(versionFileName, options)
    if (config && typeof config === 'object' && !Array.isArray(config)) {
      return config as Partial<T>
    }
  }
  catch (error) {
    console.error('[nuxt-conf] Failed to load config snapshot:', error)
    return {}
  }

  return {}
}

/**
 * Reads the `sentryRelease` value from a generated version file.
 *
 * @param versionFileName Version file path relative to `rootDir`.
 * @param options Resolution options.
 * @param options.rootDir Project root directory.
 * @returns The stored release string, or `undefined` if it cannot be loaded.
 */
export const loadSentryRelease = (
  versionFileName: string,
  options: LoadVersionFileOptions,
): string | undefined => {
  try {
    const { sentryRelease } = loadVersionFile(versionFileName, options)
    return typeof sentryRelease === 'string' ? sentryRelease : undefined
  }
  catch (error) {
    console.error('[nuxt-conf] Failed to load sentryRelease:', error)
    return undefined
  }
}
