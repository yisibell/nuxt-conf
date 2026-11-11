import { defu } from 'defu'
import { set } from 'lodash-es'
import type { NuxtOptions } from '@nuxt/schema'
import { getPublicConfig } from './public'
import type { BuildMetadata } from '../build/metadata'
import type { NuxtConfConfigObject } from '../types'

/** Options for injecting resolved build values into Nuxt options. */
export interface InjectResolvedConfigOptions {
  config: NuxtConfConfigObject
  metadata: BuildMetadata
  sentryReleasePath: string
  injectRuntimeConfig: boolean
}

/**
 * Injects resolved CDN, Sentry, appConfig, and runtimeConfig values into Nuxt.
 *
 * @param nuxtOptions Resolved Nuxt options object.
 * @param options Config and build metadata to inject.
 * @param options.config Loaded environment configuration.
 * @param options.metadata Resolved build metadata.
 * @param options.sentryReleasePath Target Nuxt option path for the release.
 * @param options.injectRuntimeConfig Whether to inject the loaded config.
 */
export const injectResolvedConfig = (
  nuxtOptions: NuxtOptions,
  {
    config,
    metadata,
    sentryReleasePath,
    injectRuntimeConfig,
  }: InjectResolvedConfigOptions,
) => {
  if (metadata.cdn) {
    config.NUXT_APP_CDN_VERSION = metadata.cdn.version
    config.NUXT_APP_CDN_URL = metadata.cdn.cdnUrl
  }

  if (metadata.sentryRelease) {
    config.NUXT_APP_SENTRY_RELEASE = metadata.sentryRelease
    set(nuxtOptions, sentryReleasePath, metadata.sentryRelease)
    nuxtOptions.runtimeConfig.NUXT_APP_SENTRY_RELEASE = metadata.sentryRelease
  }

  if (metadata.cdn?.cdnUrl) {
    nuxtOptions.app.cdnURL = metadata.cdn.cdnUrl
    nuxtOptions.runtimeConfig.app.cdnURL = metadata.cdn.cdnUrl
  }

  nuxtOptions.appConfig = defu(nuxtOptions.appConfig, getPublicConfig(config))

  if (injectRuntimeConfig) {
    nuxtOptions.runtimeConfig = defu(nuxtOptions.runtimeConfig, config)
  }
}
