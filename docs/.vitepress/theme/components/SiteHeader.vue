<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useData, withBase } from "vitepress";
import RollLink from "./RollLink.vue";

const { isDark, page } = useData();
// The theme is only known in the browser; render the label after mount to keep hydration exact.
const mounted = ref(false);
onMounted(() => (mounted.value = true));
const isHome = (): boolean => page.value.relativePath === "index.md";
const home = (hash: string): string => (isHome() ? hash : `/${hash}`);
</script>

<template>
  <header class="site-head">
    <div class="wrap site-head__row">
      <a class="brand" :href="withBase('/')" aria-label="bharat-kit home">bharat-kit<span class="brand__mark" aria-hidden="true"></span></a>
      <nav class="site-nav" aria-label="Primary">
        <RollLink :href="home('#specimen')" text="Specimen" />
        <RollLink :href="home('#modules')" text="Modules" />
        <RollLink :href="home('#find')" text="Find" />
        <RollLink href="/guide" text="Guide" :current="page.relativePath === 'guide.md'" />
        <RollLink href="https://github.com/Devkeerthi-code/bharat-kit" text="GitHub" />
      </nav>
      <button class="theme-toggle" type="button" :aria-pressed="mounted ? isDark : undefined" @click="isDark = !isDark">
        <span class="theme-toggle__dot" aria-hidden="true"></span><span class="sr-only">Dark theme: </span>
        <span class="theme-toggle__label">{{ mounted ? (isDark ? "Dark" : "Light") : "Theme" }}</span>
      </button>
    </div>
  </header>
</template>
