import { existsSync } from 'node:fs'
import { createJiti } from 'jiti'
import { createResolver } from '@nuxt/kit'
import type { NuxtConfConfigObject } from '../types'
import { mergeEnvConfig } from '../runtime/core'

/** Options for loading and merging environment configuration layers. */
export interface LoadEnvironmentConfigOptions {
  rootDir: string
  configDir: string
  envVariable: string
  defaultEnv: string
}

/** Resolved configuration and the files that contributed to it. */
export interface LoadedEnvironmentConfig {
  config?: NuxtConfConfigObject<Record<string, any>>
  environment: string
  attemptedFiles: string[]
  configFiles: string[]
  configTypeFile?: string
}

/**
 * Loads available local, environment, and default TypeScript configuration layers.
 *
 * @param options Environment selection and project path options.
 * @param options.rootDir Project root directory.
 * @param options.configDir Environment config directory relative to the root.
 * @param options.envVariable Environment selector variable name.
 * @param options.defaultEnv Fallback environment name.
 * @returns The merged configuration and contributing files, or attempted paths when none exist.
 */
export const loadEnvironmentConfig = async ({
  rootDir,
  configDir,
  envVariable,
  defaultEnv,
}: LoadEnvironmentConfigOptions): Promise<LoadedEnvironmentConfig> => {
  const resolver = createResolver(rootDir)
  const environment = process.env[envVariable] || defaultEnv
  const fileFor = (key: string) => ({ key, path: resolver.resolve(configDir, `env.${key}.ts`) })
  const typeFile = fileFor('types').path
  const environmentFiles = [`${environment}.local`, environment, `${environment}.default`]
    .filter(key => key !== 'types')
    .map(fileFor)
  const hasEnvironmentFiles = environmentFiles.some(({ path }) => existsSync(path))
  const configEnvironment = hasEnvironmentFiles ? environment : defaultEnv
  const keys = [`${configEnvironment}.local`, 'local', configEnvironment, `${configEnvironment}.default`, 'default']
  const files = [...new Set(keys)].filter(key => key !== 'types').map(fileFor)
  const configFiles = files.filter(({ path }) => existsSync(path))
  const attemptedFiles = [...new Set([...environmentFiles, ...files].map(({ path }) => path))]

  if (!configFiles.length) {
    return {
      environment,
      attemptedFiles,
      configFiles: [],
    }
  }

  const jiti = createJiti(rootDir)
  const configs: Record<string, NuxtConfConfigObject<Record<string, any>>> = {}
  for (const { key, path } of configFiles) {
    configs[key] = await jiti.import<NuxtConfConfigObject<Record<string, any>>>(path, { default: true })
  }
  const config = mergeEnvConfig(configEnvironment, configs)

  return {
    config,
    environment,
    attemptedFiles,
    configFiles: configFiles.map(({ path }) => path),
    configTypeFile: existsSync(typeFile) ? typeFile : undefined,
  }
}
