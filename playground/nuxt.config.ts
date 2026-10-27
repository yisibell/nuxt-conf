import { defineNuxtConfig } from 'nuxt/config'
import { getJobConfHostName } from './config/getJobConf'

export default defineNuxtConfig({
  modules: [
    [
      '../src/module',
      {
        injectRuntimeConfig: true,
        nuxtOptions: {
          proxy: 'proxy',
          multiCache: 'multiCache',
        },
      },
    ],
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
