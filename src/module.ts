import { defineNuxtModule, logger } from '@nuxt/kit'
import { applyNuxtOptions } from './config/options'
import { loadEnvironmentConfig } from './config/load'
import { injectResolvedConfig } from './config/inject'
import { resolveBuildMetadata } from './build/metadata'
import { registerConfigTypesHook } from './hooks/types'
import { registerUploadHook } from './hooks/upload'
import { writeVersionFile } from './version/resolve'
import type { NuxtConfModuleOptions } from './types'

export type {
  NuxtConfConfigObject,
  NuxtConfModuleOptions,
  NuxtConfS3Config,
  NuxtConfUploadOptions,
  NuxtConfValue,
  NuxtConfOptionMapping,
} from './types'

export default defineNuxtModule<NuxtConfModuleOptions>({
  meta: {
    name: 'nuxt-conf',
    configKey: 'conf',
  },

  defaults: {
    configDir: 'config/env',
    envVariable: 'NUXT_APP_ENV',
    defaultEnv: 'development',
    injectRuntimeConfig: true,
    cdn: {
      enabled: true,
    },
    writeVersionFile: true,
    writeConfigToVersionFile: false,
    writePrivateConfigToVersionFile: false,
    versionFileName: 'version.json',
    injectSentryRelease: false,
    // Prefer a unique, human-readable release for each build by default.
    sentryReleaseMode: 'sentry-release',
    sentryReleasePath: 'sentry.release.name',
    upload: {
      enabled: false,
      configFile: 'awspublish.config.cjs',
      keyPrefix: 'nuxt/pc',
    },
    nuxtOptions: {},
  },

  async setup(options, nuxt) {
    // Validate combinations that would make a later build hook fail.
    if (options.upload?.enabled && options.writeVersionFile === false) {
      throw new Error(
        '[nuxt-conf] upload.enabled requires writeVersionFile to remain enabled because S3 uploads use the version file.',
      )
    }

    // Load the environment-specific configuration with the default environment fallback.
    const loaded = await loadEnvironmentConfig({
      rootDir: nuxt.options.rootDir,
      configDir: options.configDir!,
      envVariable: options.envVariable!,
      defaultEnv: options.defaultEnv!,
    })

    if (!loaded.config) {
      logger.warn(
        `[nuxt-conf] No environment config found. Tried ${loaded.attemptedFiles.join(', ')}. Skipping configuration loading.`,
      )
      return
    }

    // Resolve all build identifiers from one timestamp for cross-integration consistency.
    const { config, environment } = loaded
    const metadata = resolveBuildMetadata(config, {
      rootDir: nuxt.options.rootDir,
      cdnEnabled: options.cdn?.enabled !== false,
      injectSentryRelease: options.injectSentryRelease === true && Boolean(options.sentryReleasePath),
      sentryReleaseMode: options.sentryReleaseMode ?? 'sentry-release',
      sentryReleaseProject: options.sentryReleaseProject,
    })

    const existingRuntimeKeys = new Set(Object.keys(nuxt.options.runtimeConfig))
    // Apply derived CDN, Sentry, appConfig, and runtimeConfig values.
    injectResolvedConfig(nuxt.options, {
      config,
      metadata,
      sentryReleasePath: options.sentryReleasePath!,
      injectRuntimeConfig: options.injectRuntimeConfig !== false,
    })
    const runtimeConfigKeys = Object.keys(nuxt.options.runtimeConfig)
      .filter(key => !existingRuntimeKeys.has(key))

    // Persist the fully resolved config and build metadata for runtime inspection and uploads.
    if (options.writeVersionFile ?? true) {
      writeVersionFile(metadata.version, {
        rootDir: nuxt.options.rootDir,
        versionFileName: options.versionFileName ?? 'version.json',
        sentryRelease: metadata.sentryRelease,
        config: options.writeConfigToVersionFile ? config : undefined,
        includePrivateConfig: options.writePrivateConfigToVersionFile === true,
      })
    }

    // Apply user-defined source-to-target option mappings.
    applyNuxtOptions(config, {
      target: nuxt.options,
      mappings: options.nuxtOptions,
    })

    // Register generated TypeScript declarations after module resolution completes.
    registerConfigTypesHook(nuxt, {
      configFiles: loaded.configFiles,
      configTypeFile: loaded.configTypeFile,
      buildDir: nuxt.options.buildDir,
      runtimeConfigKeys,
    })

    if (options.upload?.enabled) {
      registerUploadHook(nuxt, {
        environment,
        upload: options.upload,
        rootDir: nuxt.options.rootDir,
        versionFileName: options.versionFileName ?? 'version.json',
      })
    }
  },
})
