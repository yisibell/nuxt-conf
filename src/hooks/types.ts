import { addTypeTemplate } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import { createConfigTypes } from '../types/template'

/** Options for registering the generated configuration type template. */
export interface RegisterConfigTypesHookOptions {
  selectedFile: string
  buildDir: string
  injectRuntimeConfig: boolean
}

/** Registers the Nuxt hook that emits generated configuration declarations. */
export const registerConfigTypesHook = (
  nuxt: Nuxt,
  {
    selectedFile,
    buildDir,
    injectRuntimeConfig,
  }: RegisterConfigTypesHookOptions,
) => {
  nuxt.hook('modules:done', () => {
    addTypeTemplate({
      filename: 'nuxt-conf.d.ts',
      getContents: () => createConfigTypes(selectedFile, {
        buildDir,
        injectRuntimeConfig,
      }),
    })
  })
}
