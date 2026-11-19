import { addTypeTemplate } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import { createConfigTypes } from '../types/template'

/** Options for registering the generated configuration type template. */
export interface RegisterConfigTypesHookOptions {
  configFiles: string[]
  configTypeFile?: string
  buildDir: string
  runtimeConfigKeys: readonly string[]
}

/** Registers the Nuxt hook that emits generated configuration declarations. */
export const registerConfigTypesHook = (
  nuxt: Nuxt,
  {
    configFiles,
    configTypeFile,
    buildDir,
    runtimeConfigKeys,
  }: RegisterConfigTypesHookOptions,
) => {
  if (runtimeConfigKeys.length) {
    const typedKeys = new Set(runtimeConfigKeys)
    nuxt.hook('app:templates', (app) => {
      const index = app.templates.findIndex(template => template.filename === 'types/schema.d.ts')
      const template = app.templates[index]
      if (!template?.getContents) return

      const getContents = template.getContents
      app.templates[index] = {
        ...template,
        getContents: (context) => {
          // Nuxt infers these fields from values. Let our declaration supply their types instead.
          const { app, public: publicConfig, ...runtimeFields } = context.nuxt.options.runtimeConfig
          const runtimeConfig = {
            ...Object.fromEntries(Object.entries(runtimeFields).filter(([key]) => !typedKeys.has(key))),
            app,
            public: publicConfig,
          }
          return getContents({
            ...context,
            nuxt: {
              ...context.nuxt,
              options: {
                ...context.nuxt.options,
                runtimeConfig: runtimeConfig as Nuxt['options']['runtimeConfig'],
              },
            },
          })
        },
      }
    })
  }

  nuxt.hook('modules:done', () => {
    addTypeTemplate({
      filename: 'nuxt-conf.d.ts',
      getContents: () => createConfigTypes(configFiles, {
        buildDir,
        configTypeFile,
        runtimeConfigKeys,
      }),
    })
  })
}
