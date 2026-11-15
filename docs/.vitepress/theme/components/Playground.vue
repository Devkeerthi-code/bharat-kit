<script setup lang="ts">
import { computed, ref } from "vue";
import { PLAYGROUNDS, type PlaygroundOutcome, type PlaygroundSpec } from "../data/playgrounds";
import { highlight } from "../lib/highlight";

const props = defineProps<{ module: string }>();

const spec = computed(() => PLAYGROUNDS[props.module] as PlaygroundSpec);
const input = ref(spec.value.initial);
const id = `pg-${props.module}`;

const outcome = computed<PlaygroundOutcome | null>(() => (input.value.trim() === "" ? null : spec.value.run(input.value)));
const verdict = computed(() => (outcome.value === null ? "idle" : outcome.value.ok ? "valid" : "invalid"));
const json = computed(() =>
  highlight(outcome.value === null ? `// ${spec.value.label} result appears here` : JSON.stringify(outcome.value.output, null, 2)),
);

/** The value as the library sees it, one character per cell. */
const cellValue = computed(() => input.value.replace(/[\s.-]+/g, "").toUpperCase());
</script>

<template>
  <div class="pg">
    <div>
      <label class="pg__label" :for="id">{{ spec.label }}</label>
      <input
        :id="id"
        v-model="input"
        class="pg__field"
        :placeholder="spec.placeholder"
        :inputmode="spec.inputMode ?? 'text'"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
        :aria-describedby="`${id}-result`"
      />
      <div
        v-if="spec.cells"
        class="cells"
        :style="{ '--cells': spec.cells.length }"
        aria-hidden="true"
      >
        <span
          v-for="i in spec.cells.length"
          :key="i"
          class="cells__cell"
          :class="{ 'is-boundary': spec.cells.boundaries.includes(i - 1), 'is-bad': outcome?.index === i - 1 }"
        >{{ cellValue[i - 1] ?? "" }}</span>
      </div>
      <div class="chips" role="group" aria-label="Examples to try">
        <button v-for="[label, value] in spec.samples" :key="label" class="chip" type="button" @click="input = value">{{ label }}</button>
      </div>
      <p v-if="module === 'aadhaar'" class="pg__privacy">
        This check runs in your browser. Nothing you type here is stored, logged or sent anywhere. Use the demo number, not a real one.
      </p>
    </div>
    <div :id="`${id}-result`">
      <div class="pg__verdict">
        <span class="verdict" :data-state="verdict">{{ verdict === "idle" ? "Waiting" : verdict === "valid" ? "Valid" : "Invalid" }}</span>
        <code v-if="outcome && !outcome.ok" class="pg__code">{{ outcome.reason }}</code>
      </div>
      <p class="pg__message" aria-live="polite">{{ outcome ? outcome.message : `Type or paste a ${spec.label.toLowerCase()}.` }}</p>
      <pre class="code"><code v-html="json"></code></pre>
    </div>
  </div>
</template>
