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
        <pre>{{ runtimeConfigText }}</pre>
      </article>
    </div>
  </section>
</template>

<script lang="ts" setup>
defineProps<{
  appConfigText: string
  runtimeConfigText: string
}>()
</script>
