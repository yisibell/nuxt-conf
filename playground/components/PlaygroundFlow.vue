<template>
  <section class="content-section flow-section">
    <div class="section-label"><span>03</span><span>THE FLOW</span></div>
    <div class="flow-layout">
      <div class="flow-copy">
        <h2>Declare once.<br><em>Connect everything.</em></h2>
        <p>The module selects the environment file, resolves the CDN, separates public configuration, and maps values to other Nuxt modules.</p>
      </div>
      <div class="flow-list">
        <div class="flow-item"><b>01</b><span><strong>Environment file</strong><small>config/env/env.development.ts</small></span><em>↗</em></div>
        <div class="flow-item active"><b>02</b><span><strong>nuxt-conf</strong><small>load · resolve · inject</small></span><em>↗</em></div>
        <div class="flow-item"><b>03</b><span><strong>Nuxt application</strong><small>appConfig · runtimeConfig · options</small></span><em>↗</em></div>
      </div>
    </div>
  </section>
</template>
