import { addTypeTemplate, createResolver, defineNuxtModule, logger } from '@nuxt/kit'
import { defu } from 'defu'
import { createJiti } from 'jiti'
import { get, isPlainObject, set } from 'lodash-es'
import { existsSync } from 'node:fs'
import { getPublicConfig } from './config/public'
import { resolveCdnUrl } from './cdn/resolve'
import { createConfigTypes } from './types/template'
import type { NuxtConfConfigObject, NuxtConfModuleOptions } from './types'

export type {
  NuxtConfConfigObject,
  NuxtConfModuleOptions,
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
    cdn: {
      enabled: true,
      writeVersionFile: true,
      versionFileName: 'version.json',
    },
    nuxtOptions: {},
  },

  async setup(options, nuxt) {
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

    const jiti = createJiti(nuxt.options.rootDir)
    const config = await jiti.import<NuxtConfConfigObject>(selectedFile, { default: true })
    const cdnUrl = options.cdn?.enabled === false
      ? undefined
      : resolveCdnUrl(
          config,
          nuxt.options.rootDir,
          options.cdn?.writeVersionFile,
          options.cdn?.versionFileName,
        )
    const publicConfig = getPublicConfig(config)

    nuxt.options.appConfig = defu(nuxt.options.appConfig, publicConfig)
    nuxt.options.runtimeConfig = defu(nuxt.options.runtimeConfig, config)

    nuxt.hook('modules:done', () => {
      addTypeTemplate({
        filename: 'nuxt-conf.d.ts',
        getContents: () => createConfigTypes(
          selectedFile,
          nuxt.options.buildDir,
        ),
      })
    })

    if (cdnUrl) {
      nuxt.options.app = defu(nuxt.options.app, { cdnURL: cdnUrl })
    }

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
  },
})
