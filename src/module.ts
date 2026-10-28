import { addTypeTemplate, createResolver, defineNuxtModule, logger } from '@nuxt/kit'
import { defu } from 'defu'
import { createJiti } from 'jiti'
import { get, isPlainObject, set } from 'lodash-es'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { getPublicConfig } from './config/public'
import { resolveCdnUrl } from './cdn/resolve'
import { createConfigTypes } from './types/template'
import { uploadBuildOutput } from './upload/s3'
import type { NuxtConfConfigObject, NuxtConfModuleOptions } from './types'

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
    configKey: 'nuxtConf',
  },

  defaults: {
    configDir: 'config/env',
    envVariable: 'NUXT_APP_ENV',
    defaultEnv: 'development',
    injectRuntimeConfig: true,
    cdn: {
      enabled: true,
      writeVersionFile: true,
      versionFileName: 'version.json',
    },
    upload: {
      enabled: false,
      configFile: 'awspublish.config.cjs',
      keyPrefix: 'nuxt/pc',
    },
    nuxtOptions: {},
  },

  async setup(options, nuxt) {
    // Select the environment-specific config file and fall back to the default environment.
    const resolver = createResolver(nuxt.options.rootDir)
    const environment = process.env[options.envVariable!] || options.defaultEnv!
    const configFile = resolver.resolve(options.configDir!, `env.${environment}.ts`)
    const fallbackFile = resolver.resolve(options.configDir!, `env.${options.defaultEnv}.ts`)
    const selectedFile = existsSync(configFile) ? configFile : fallbackFile

    if (!existsSync(selectedFile)) {
      logger.warn(
        `[nuxt-conf] No environment config found. Tried ${configFile} and ${fallbackFile}. Skipping configuration loading.`,
      )
      return
    }

    // Load the TypeScript config at build time so it can be shared by all integrations below.
    const jiti = createJiti(nuxt.options.rootDir)
    const config = await jiti.import<NuxtConfConfigObject>(selectedFile, { default: true })

    // Resolve the CDN URL before injecting appConfig, because the resolver may enrich the config.
    const cdnUrl = options.cdn?.enabled === false
      ? undefined
      : resolveCdnUrl(
          config,
          nuxt.options.rootDir,
          options.cdn?.writeVersionFile,
          options.cdn?.versionFileName,
        )

    // Apply the resolved CDN URL to Nuxt's application options.
    if (cdnUrl) {
      // Nuxt resolves app.cdnURL before module setup and may have initialized it to ''.
      // Assign directly so the generated URL also reaches runtimeConfig.app.cdnURL.
      nuxt.options.app.cdnURL = cdnUrl
      nuxt.options.runtimeConfig.app.cdnURL = cdnUrl
    }

    const publicConfig = getPublicConfig(config)

    // Keep private values out of appConfig, while optionally exposing the complete config server-side.
    nuxt.options.appConfig = defu(nuxt.options.appConfig, publicConfig)
    if (options.injectRuntimeConfig !== false) {
      nuxt.options.runtimeConfig = defu(nuxt.options.runtimeConfig, config)
    }

    // Map selected config paths to Nuxt or other module options without overwriting by default.
    for (const [targetPath, mapping] of Object.entries(options.nuxtOptions || {})) {
      const sourcePath = typeof mapping === 'string' ? mapping : mapping.from
      const override = typeof mapping === 'string' ? false : mapping.override === true
      const value = get(config, sourcePath)
      const currentValue = get(nuxt.options, targetPath)

      if (value === undefined) {
        continue
      }

      if (override || currentValue === undefined) {
        set(nuxt.options, targetPath, value)
      }
      else if (isPlainObject(currentValue) && isPlainObject(value)) {
        set(nuxt.options, targetPath, defu(currentValue, value))
      }
    }

    // Register type declarations after all configuration and option mappings are complete.
    nuxt.hook('modules:done', () => {
      addTypeTemplate({
        filename: 'nuxt-conf.d.ts',
        getContents: () => createConfigTypes(
          selectedFile,
          nuxt.options.buildDir,
          options.injectRuntimeConfig !== false,
        ),
      })
    })

    if (options.upload?.enabled && !nuxt.options.dev) {
      // Upload only after Nitro has finished producing the public build output.
      nuxt.hook('build:done', async () => {
        logger.start(`[nuxt-conf] Uploading S3 static assets [${environment}]`)

        try {
          await uploadBuildOutput({
            rootDir: nuxt.options.rootDir,
            environment,
            upload: options.upload!,
            outputDir: nuxt.options.nitro?.output?.publicDir
              ?? resolve(nuxt.options.rootDir, options.upload?.outputDir ?? '.output/public'),
            versionFileName: options.cdn?.versionFileName ?? 'version.json',
          })
          logger.success(`[nuxt-conf] S3 static assets uploaded [${environment}]`)
        }
        catch (error) {
          logger.error('[nuxt-conf] S3 static asset upload failed:', error)
          throw error
        }
      })
    }
  },
})
