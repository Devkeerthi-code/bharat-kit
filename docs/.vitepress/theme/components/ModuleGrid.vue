<script setup lang="ts">
import { withBase } from "vitepress";
import { MODULES } from "../data/modules";
</script>

<template>
  <ul class="glyphs">
    <li v-for="(m, i) in MODULES" :key="m.slug">
      <a class="glyph" :href="withBase(`/${m.slug}`)" :style="{ '--chars': m.sample.length }">
        <span class="glyph__idx">{{ String(i + 1).padStart(2, "0") }}</span>
        <span class="glyph__sample" aria-hidden="true">{{ m.sample }}</span>
        <span class="glyph__name">{{ m.name }}</span>
        <span class="glyph__purpose">{{ m.purpose }}</span>
      </a>
    </li>
  </ul>
</template>
