<template>
  <section class="hero-section">
    <div class="hero-grid" />
    <header class="topbar">
      <div class="brand-lockup">
        <span class="brand-mark">N</span>
        <span>nuxt-conf</span>
      </div>
      <div class="topbar-meta">
        <span class="version">v1.0.0</span>
        <span class="availability"><i /> Playground</span>
      </div>
    </header>

    <div class="hero-content">
      <div class="hero-copy">
        <p class="kicker">A CONFIGURATION LAYER FOR NUXT</p>
        <h1>One source.<br><em>Everywhere.</em></h1>
        <p class="hero-description">
          Keep environment configuration in TypeScript and let the module connect it to
          Nuxt's appConfig, runtimeConfig, and module options automatically.
        </p>
        <div class="hero-actions">
          <span class="hero-chip">CONFIG / ENV / TS</span>
          <span class="hero-note">No duplicated declarations</span>
        </div>
      </div>

      <div class="hero-terminal">
        <div class="terminal-bar">
          <span><i /><i /><i /></span>
          <code>config/env/env.development.ts</code>
        </div>
        <pre><span class="syntax-key">export default</span> {
  <span class="syntax-prop">NUXT_APP_ENV</span>: <span class="syntax-string">'development'</span>,
  <span class="syntax-prop">NUXT_APP_BASE_API</span>: <span class="syntax-string">'/api'</span>,
  <span class="syntax-prop">NUXT_APP_CDN_BASE_URL</span>:
    <span class="syntax-string">'https://cdn.example.com/assets'</span>,
  <span class="syntax-prop">private</span>: {
    <span class="syntax-prop">private</span>: <span class="syntax-value">true</span>,
  },
}</pre>
        <div class="terminal-footer">
          <span>loaded by nuxt-conf</span>
          <span>● ready</span>
        </div>
      </div>
    </div>
  </section>
</template>
