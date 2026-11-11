import { existsSync, readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { createCdnVersion, resolveCdnUrl, type ResolvedCdn } from '../cdn/resolve'
import { createSentryRelease } from '../sentry/release'
import type { NuxtConfConfigObject, NuxtConfModuleOptions } from '../types'

/** Build identifiers shared by CDN, Sentry, and version-file integrations. */
export interface BuildMetadata {
  timestamp: number
  version: string
  cdn?: ResolvedCdn
  sentryRelease?: string
}

/** Options for resolving build identifiers. */
export interface ResolveBuildMetadataOptions {
  rootDir: string
  cdnEnabled: boolean
  injectSentryRelease: boolean
  sentryReleaseMode: NonNullable<NuxtConfModuleOptions['sentryReleaseMode']>
  sentryReleaseProject?: string
}

/**
 * Resolves the build timestamp, version, optional CDN URL, and Sentry release.
 *
 * @param config Loaded environment configuration.
 * @param options Build metadata options.
 * @param options.rootDir Project root directory.
 * @param options.cdnEnabled Whether CDN URL resolution is enabled.
 * @param options.injectSentryRelease Whether to generate a Sentry release.
 * @param options.sentryReleaseMode Sentry release generation mode.
 * @param options.sentryReleaseProject Optional Sentry project name.
 * @returns Consistent build metadata derived from one timestamp.
 */
export const resolveBuildMetadata = (
  config: NuxtConfConfigObject,
  {
    rootDir,
    cdnEnabled,
    injectSentryRelease,
    sentryReleaseMode,
    sentryReleaseProject,
  }: ResolveBuildMetadataOptions,
): BuildMetadata => {
  const timestamp = Date.now()
  const generatedVersion = createCdnVersion(timestamp)
  const cdn = cdnEnabled ? resolveCdnUrl(config, generatedVersion) : undefined
  const version = cdn?.version ?? config.NUXT_APP_CDN_VERSION ?? generatedVersion

  let sentryRelease: string | undefined

  if (injectSentryRelease) {
    const packageFile = resolve(rootDir, 'package.json')
    const projectName = sentryReleaseProject
      ?? (existsSync(packageFile)
        ? JSON.parse(readFileSync(packageFile, 'utf8')).name
        : undefined)
      ?? basename(rootDir)

    sentryRelease = createSentryRelease(sentryReleaseMode, {
      cdnVersion: version,
      projectName,
      timestamp,
    })
  }

  return {
    timestamp,
    version,
    cdn,
    sentryRelease,
  }
}
