<script setup lang="ts">
import { useData, withBase } from "vitepress";
import HomePage from "./components/HomePage.vue";
import ModuleLayout from "./components/ModuleLayout.vue";
import SiteFooter from "./components/SiteFooter.vue";
import SiteHeader from "./components/SiteHeader.vue";

const { frontmatter, page } = useData();
</script>

<template>
  <a class="skip" href="#main">Skip to content</a>
  <SiteHeader />
  <main id="main">
    <section v-if="page.isNotFound" class="wrap not-found">
      <p class="eyebrow">404 · not in the set</p>
      <h1>This page isn't in the specimen.</h1>
      <p>The address may have changed. The module index lists every page.</p>
      <a class="btn btn--ink" :href="withBase('/#modules')">See all modules</a>
    </section>
    <HomePage v-else-if="frontmatter.layout === 'home'" />
    <ModuleLayout v-else />
  </main>
  <SiteFooter />
</template>
