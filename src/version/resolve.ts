import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/** Parsed contents of a generated version file. */
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

/** Options for writing a generated version file. */
export interface WriteVersionFileOptions {
  rootDir: string
  versionFileName?: string
  sentryRelease?: string
}

/**
 * Writes the build version and optional Sentry release to a JSON file.
 *
 * @param version Build version to write.
 * @param options Write options.
 * @param options.rootDir Project root directory.
 * @param options.versionFileName Target file path relative to `rootDir`.
 * @param options.sentryRelease Optional Sentry release to include.
 */
export const writeVersionFile = (
  version: string,
  {
    rootDir,
    versionFileName = 'version.json',
    sentryRelease,
  }: WriteVersionFileOptions,
) => {
  const versionPath = resolve(rootDir, versionFileName)

  mkdirSync(dirname(versionPath), { recursive: true })
  writeFileSync(
    versionPath,
    JSON.stringify({
      version,
      ...(sentryRelease ? { sentryRelease } : {}),
    }),
  )
}
