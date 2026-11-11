import { existsSync } from 'node:fs'
import { createJiti } from 'jiti'
import { createResolver } from '@nuxt/kit'
import type { NuxtConfConfigObject } from '../types'

/** Options for loading the selected environment configuration. */
export interface LoadEnvironmentConfigOptions {
  rootDir: string
  configDir: string
  envVariable: string
  defaultEnv: string
}

/** Result of environment configuration resolution, including attempted paths. */
export interface LoadedEnvironmentConfig {
  config?: NuxtConfConfigObject
  environment: string
  selectedFile: string
  configFile: string
  fallbackFile: string
}

/**
 * Selects and loads the environment-specific TypeScript configuration.
 *
 * @param options Environment selection and project path options.
 * @param options.rootDir Project root directory.
 * @param options.configDir Environment config directory relative to the root.
 * @param options.envVariable Environment selector variable name.
 * @param options.defaultEnv Fallback environment name.
 * @returns Loaded configuration metadata, or attempted paths when no file exists.
 */
export const loadEnvironmentConfig = async ({
  rootDir,
  configDir,
  envVariable,
  defaultEnv,
}: LoadEnvironmentConfigOptions): Promise<LoadedEnvironmentConfig> => {
  const resolver = createResolver(rootDir)
  const environment = process.env[envVariable] || defaultEnv
  const configFile = resolver.resolve(configDir, `env.${environment}.ts`)
  const fallbackFile = resolver.resolve(configDir, `env.${defaultEnv}.ts`)
  const selectedFile = existsSync(configFile) ? configFile : fallbackFile

  if (!existsSync(selectedFile)) {
    return {
      environment,
      selectedFile,
      configFile,
      fallbackFile,
    }
  }

  const jiti = createJiti(rootDir)
  const config = await jiti.import<NuxtConfConfigObject>(selectedFile, { default: true })

  return {
    config,
    environment,
    selectedFile,
    configFile,
    fallbackFile,
  }
}
