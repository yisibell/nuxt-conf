import { defineNuxtConfig } from 'nuxt/config'
import { getJobConfHostName } from './config/getJobConf'

export default defineNuxtConfig({
  modules: [
    [
      '../src/module',
      {
        injectRuntimeConfig: true,
        injectSentryRelease: true,
        sentryReleaseMode: 'sentry-release',
        writeVersionFile: true,
        versionFileName: 'version.json',
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

  compatibilityDate: '2024-12-30',

})
