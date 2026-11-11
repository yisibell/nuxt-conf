import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

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
