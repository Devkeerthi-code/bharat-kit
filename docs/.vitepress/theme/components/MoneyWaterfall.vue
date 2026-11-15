<script setup lang="ts">
import { computed, ref } from "vue";
import { groupIndian, parseAmount, toShortForm, toWords } from "bharat-kit";

type Field = "raw" | "grouped" | "short";

const SAMPLES: readonly (readonly [label: string, rupees: number])[] = [
  ["₹999", 999],
  ["₹45,000", 45000],
  ["₹12.5 L", 1250000],
  ["₹3.4 Cr", 34000000],
  ["₹100 Cr", 1000000000],
];

const rupees = ref(1250000);
const editing = ref<Field | null>(null);
const drafts = ref<Record<Field, string>>({ raw: "", grouped: "", short: "" });
const error = ref("");

const formatted: Record<Field, (n: number) => string> = {
  raw: (n) => String(n),
  grouped: (n) => groupIndian(n),
  short: (n) => toShortForm(n, { symbol: true }),
};

function shown(field: Field): string {
  return editing.value === field ? drafts.value[field] : formatted[field](rupees.value);
}

const whole = computed(() => Math.floor(rupees.value));
const english = computed(() => toWords(whole.value));
const hindi = computed(() => toWords(whole.value, "hi"));

function onInput(field: Field, event: Event): void {
  const text = (event.target as HTMLInputElement).value;
  editing.value = field;
  drafts.value = { ...drafts.value, [field]: text };
  const parsed = parseAmount(text);
  if (!parsed.ok) {
    error.value = parsed.message;
    return;
  }
  error.value = "";
  rupees.value = Math.floor(parsed.value.rupees);
}

function onBlur(): void {
  editing.value = null;
  error.value = "";
}

function pick(value: number): void {
  editing.value = null;
  error.value = "";
  rupees.value = value;
}
</script>

<template>
  <div class="money" :class="{ 'is-invalid': error }">
    <div class="money__row">
      <label class="money__meta" for="m-raw"><span class="money__size">01</span>Raw number</label>
      <input id="m-raw" class="money__field money__field--1" :value="shown('raw')" :aria-invalid="editing === 'raw' && !!error" inputmode="numeric" autocomplete="off" spellcheck="false" @input="onInput('raw', $event)" @blur="onBlur" />
    </div>
    <div class="money__row">
      <label class="money__meta" for="m-grouped"><span class="money__size">02</span>groupIndian()</label>
      <input id="m-grouped" class="money__field money__field--2" :value="shown('grouped')" :aria-invalid="editing === 'grouped' && !!error" inputmode="numeric" autocomplete="off" spellcheck="false" @input="onInput('grouped', $event)" @blur="onBlur" />
    </div>
    <div class="money__row">
      <label class="money__meta" for="m-short"><span class="money__size">03</span>toShortForm()</label>
      <input id="m-short" class="money__field money__field--3" :value="shown('short')" :aria-invalid="editing === 'short' && !!error" aria-describedby="m-short-hint" autocomplete="off" spellcheck="false" @input="onInput('short', $event)" @blur="onBlur" />
    </div>
    <div class="money__row">
      <p id="m-en-label" class="money__meta"><span class="money__size">04</span>toWords(n) <span class="money__ro">Output only</span></p>
      <p class="money__out money__out--4" aria-labelledby="m-en-label">{{ english }}</p>
    </div>
    <div class="money__row">
      <p id="m-hi-label" class="money__meta"><span class="money__size">05</span>toWords(n, "hi") <span class="money__ro">Output only</span></p>
      <p class="money__out money__out--5" lang="hi" aria-labelledby="m-hi-label">{{ hindi }}</p>
    </div>
    <div class="money__foot">
      <p id="m-short-hint" class="money__hint">Short form accepts K, L, lakh, Cr and crore. Try <span class="mono">3.4 Cr</span>.</p>
      <p class="money__note" aria-live="polite">{{ error }}</p>
      <div class="chips" role="group" aria-label="Sample amounts">
        <button v-for="[label, value] in SAMPLES" :key="value" class="chip" type="button" @click="pick(value)">{{ label }}</button>
      </div>
    </div>
  </div>
</template>
