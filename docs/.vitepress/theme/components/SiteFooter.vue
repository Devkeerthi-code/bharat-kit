<script setup lang="ts">
import { ref } from "vue";
import RollLink from "./RollLink.vue";

const label = ref("Copy");

async function copyInstall(): Promise<void> {
  try {
    await navigator.clipboard.writeText("npm i bharat-kit");
    label.value = "Copied";
  } catch {
    label.value = "Select and copy";
  }
  setTimeout(() => (label.value = "Copy"), 1400);
}
</script>

<template>
  <footer class="site-foot">
    <div class="wrap site-foot__grid">
      <div class="install">
        <p class="eyebrow">Install</p>
        <div class="install__line">
          <code class="install__cmd">npm i bharat-kit</code>
          <button class="btn" type="button" aria-live="polite" @click="copyInstall">{{ label }}</button>
        </div>
      </div>
      <dl class="colophon">
        <div><dt>Dependencies</dt><dd>Zero</dd></div>
        <div><dt>Licence</dt><dd>MIT</dd></div>
        <div><dt>Runtime</dt><dd>Browser, Node, edge</dd></div>
        <div><dt>Types</dt><dd>Included</dd></div>
      </dl>
      <p class="site-foot__small">
        <span>All identifiers on this site are invented demo values.</span>
        <RollLink href="https://www.npmjs.com/package/bharat-kit" text="npm" />
        <RollLink href="https://github.com/Devkeerthi-code/bharat-kit" text="Source" />
        <RollLink href="https://github.com/Devkeerthi-code/bharat-kit/blob/main/CHANGELOG.md" text="Changelog" />
      </p>
    </div>
  </footer>
</template>
