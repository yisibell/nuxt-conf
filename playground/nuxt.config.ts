import { fileURLToPath } from 'node:url'
import { defineNuxtConfig } from 'nuxt/config'
import { getJobConfHostName } from './config/getJobConf'

export default defineNuxtConfig({

  modules: [
    [
      '../src/module',
      {
        injectRuntimeConfig: true,
        injectSentryRelease: true,
        writeConfigToVersionFile: true,
        writePrivateConfigToVersionFile: true,
        nuxtOptions: {
          proxy: 'proxy',
          multiCache: 'multiCache',
        },
        upload: {
          enabled: false,
          publish: {
            options: {
              simulate: true,
            },
          },
          reporter: true,
        },
      },
    ],

    '~/modules/print-nuxt-options',

  ],

  css: [
    '~/assets/styles/index.scss',
  ],

  appConfig: {
    job_host_name: getJobConfHostName(),
  },

  runtimeConfig: {
    some_custom_key: 1,
  },

  alias: {
    'nuxt-conf/core': fileURLToPath(new URL('../src/runtime/core/index.ts', import.meta.url)),
  },

  compatibilityDate: '2024-12-30',

})
