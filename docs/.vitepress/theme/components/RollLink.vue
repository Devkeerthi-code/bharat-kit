<script setup lang="ts">
import { computed } from "vue";
import { withBase } from "vitepress";

const props = defineProps<{ href: string; text: string; current?: boolean }>();

const external = computed(() => /^https?:\/\//.test(props.href));
const target = computed(() => (external.value || props.href.startsWith("#") ? props.href : withBase(props.href)));
</script>

<template>
  <a
    class="roll"
    :href="target"
    :aria-current="current ? 'page' : undefined"
    :target="external ? '_blank' : undefined"
    :rel="external ? 'noopener' : undefined"
    ><span :data-text="text">{{ text }}</span></a
  >
</template>
