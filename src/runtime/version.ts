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
