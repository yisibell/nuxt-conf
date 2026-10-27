<template>
  <section class="content-section object-section">
    <div class="section-label"><span>02</span><span>LIVE OBJECTS</span></div>
    <div class="section-heading">
      <h2>Nothing hidden<br><em>behind the setup.</em></h2>
      <p>These are the complete configuration objects available at runtime.</p>
    </div>

    <div class="object-grid">
      <article class="object-card">
        <div class="object-header">
          <div><span class="object-index">A</span><h3>appConfig</h3></div>
          <code>useAppConfig()</code>
        </div>
        <pre>{{ appConfigText }}</pre>
      </article>
      <article class="object-card object-card-dark">
        <div class="object-header">
          <div><span class="object-index">R</span><h3>runtimeConfig</h3></div>
          <code>useRuntimeConfig()</code>
        </div>
        <ClientOnly>
          <pre>{{ runtimeConfigText }}</pre>
          <template #fallback><pre>{}</pre></template>
        </ClientOnly>
      </article>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRuntimeConfig } from '#imports'

const runtimeConfig = useRuntimeConfig()
const runtimeConfigText = computed(() => JSON.stringify({ ...runtimeConfig }, null, 2))

if (import.meta.dev) {
  console.log(`[playground][${import.meta.server ? 'server' : 'client'}] runtimeConfig:`, { ...runtimeConfig })
}

defineProps<{
  appConfigText: string
}>()
</script>
