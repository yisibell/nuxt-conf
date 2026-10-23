<template>
  <main class="site-shell">
    <PlaygroundHero />
    <PlaygroundResolvedValues :app-config="appConfig" />
    <PlaygroundLiveObjects
      :app-config-text="appConfigText"
      :runtime-config-text="runtimeConfigText"
    />
    <PlaygroundFlow />

    <footer class="site-footer">
      <span>nuxt-conf / playground</span>
      <span>Configuration without repetition.</span>
    </footer>
  </main>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useAppConfig, useRuntimeConfig } from '#imports'
import PlaygroundFlow from './components/PlaygroundFlow.vue'
import PlaygroundHero from './components/PlaygroundHero.vue'
import PlaygroundLiveObjects from './components/PlaygroundLiveObjects.vue'
import PlaygroundResolvedValues from './components/PlaygroundResolvedValues.vue'

const appConfig = useAppConfig()
const runtimeConfig = useRuntimeConfig()

const appConfigText = computed(() => JSON.stringify(appConfig, null, 2))
const runtimeConfigText = computed(() => JSON.stringify(runtimeConfig, null, 2))
</script>
