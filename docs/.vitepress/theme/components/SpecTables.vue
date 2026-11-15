<script setup lang="ts">
import { computed } from "vue";
import { moduleBySlug, type ModuleInfo } from "../data/modules";
import sizes from "../data/sizes.json";

const props = defineProps<{ module: string; part?: "functions" | "errors" | "sources" }>();

const info = computed(() => moduleBySlug(props.module) as ModuleInfo);
const measured = sizes as Record<string, Record<string, number>>;

function sizeOf(fn: string): string {
  const bytes = measured[props.module]?.[fn];
  return bytes === undefined ? "–" : `${bytes} B`;
}
</script>

<template>
  <div v-if="!part || part === 'functions'">
    <article v-for="fn in info.functions" :id="`fn-${fn.name}`" :key="fn.name" class="spec">
      <h3 class="spec__name">{{ fn.name }}</h3>
      <table class="spec__table">
        <tbody>
          <tr><th scope="row">Signature</th><td class="mono">{{ fn.signature }}</td></tr>
          <tr><th scope="row">Returns</th><td class="mono">{{ fn.returns }}</td></tr>
          <tr v-if="fn.errors"><th scope="row">Errors</th><td>{{ fn.errors }}</td></tr>
          <tr v-if="fn.note"><th scope="row">Notes</th><td>{{ fn.note }}</td></tr>
          <tr>
            <th scope="row">Size</th>
            <td class="spec__size">{{ sizeOf(fn.name) }} <small>min + gzip, imported alone</small></td>
          </tr>
        </tbody>
      </table>
    </article>
  </div>

  <table v-if="!part || part === 'errors'" class="errors">
    <thead><tr><th scope="col">reason</th><th scope="col">Meaning</th></tr></thead>
    <tbody>
      <tr v-for="[code, meaning] in info.errors" :key="code"><td>{{ code }}</td><td>{{ meaning }}</td></tr>
    </tbody>
  </table>

  <ul v-if="!part || part === 'sources'" class="sources">
    <li v-for="s in info.sources" :key="s.url"><a :href="s.url" target="_blank" rel="noopener">{{ s.label }}</a></li>
  </ul>
</template>
