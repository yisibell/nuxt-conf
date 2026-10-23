import { defineNuxtConfig } from 'nuxt/config'
import { getJobConfHostName } from './config/getJobConf'

export default defineNuxtConfig({
  modules: [
    [
      '../src/module',
      {
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

  compatibilityDate: '2024-12-30',

})
