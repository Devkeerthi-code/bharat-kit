<script setup lang="ts">
import { computed } from "vue";
import { Content, useData } from "vitepress";
import { MODULES, moduleBySlug } from "../data/modules";
import sizes from "../data/sizes.json";
import RollLink from "./RollLink.vue";

const { frontmatter, page } = useData();

const info = computed(() => moduleBySlug(String(frontmatter.value.module ?? "")));
const title = computed(() => info.value?.name ?? String(frontmatter.value.title ?? page.value.title));
const lede = computed(() => String(frontmatter.value.lede ?? info.value?.purpose ?? ""));
// h2 headings extracted at build time (markdown.headers in config.ts), so the list is server-rendered.
const sections = computed(() => page.value.headers.map((h) => ({ id: h.slug, text: h.title })));

const moduleSize = computed(() => {
  const slug = info.value?.slug;
  if (!slug) return "";
  const values = Object.values((sizes as Record<string, Record<string, number>>)[slug] ?? {});
  return values.length ? `${Math.min(...values)}–${Math.max(...values)} B per function` : "";
});
</script>

<template>
  <div class="wrap module">
    <aside class="module__side" aria-label="On this page">
      <nav class="toc">
        <p class="eyebrow">On this page</p>
        <ol>
          <li v-for="s in sections" :key="s.id"><RollLink :href="`#${s.id}`" :text="s.text" /></li>
        </ol>
        <div v-if="info" class="toc__set">
          <p class="eyebrow">The set</p>
          <ul>
            <li v-for="m in MODULES" :key="m.slug"><RollLink :href="`/${m.slug}`" :text="m.name" :current="m.slug === info.slug" /></li>
          </ul>
        </div>
      </nav>
    </aside>

    <article class="module__body">
      <p class="eyebrow">{{ info ? `Module · bharat-kit/${info.slug}` : "Guide" }}</p>
      <h1 class="module__title">{{ title }}</h1>
      <p class="module__lede">{{ lede }}</p>
      <dl v-if="info" class="facts">
        <div><dt>Import</dt><dd class="mono">bharat-kit/{{ info.slug }}</dd></div>
        <div><dt>Sample</dt><dd class="mono">{{ info.sample }}</dd></div>
        <div><dt>Functions</dt><dd>{{ info.functions.length }}</dd></div>
        <div><dt>Size</dt><dd>{{ moduleSize }}</dd></div>
      </dl>
      <Content class="prose" />
    </article>
  </div>
</template>
