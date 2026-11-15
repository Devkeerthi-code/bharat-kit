<script setup lang="ts">
import { computed, ref } from "vue";
import { buildUpiLink, parseAmount } from "bharat-kit";

const payeeVpa = ref("demo.shop@okbank");
const payeeName = ref("Demo Shop");
const amount = ref("125.50");
const note = ref("Invoice 1042");
const copied = ref(false);

const result = computed(() => {
  let amountPaise: number | undefined;
  if (amount.value.trim() !== "") {
    const parsed = parseAmount(amount.value);
    if (!parsed.ok) return { ok: false as const, message: parsed.message };
    amountPaise = parsed.value.paise;
  }
  return buildUpiLink({
    payeeVpa: payeeVpa.value,
    payeeName: payeeName.value,
    note: note.value,
    ...(amountPaise === undefined ? {} : { amountPaise }),
  });
});

async function copy(): Promise<void> {
  if (!result.value.ok) return;
  try {
    await navigator.clipboard.writeText(result.value.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1400);
  } catch {
    copied.value = false;
  }
}
</script>

<template>
  <form class="builder" @submit.prevent>
    <label>Payee UPI ID <input v-model="payeeVpa" autocomplete="off" spellcheck="false" inputmode="email" /></label>
    <label>Payee name <input v-model="payeeName" autocomplete="off" /></label>
    <label>Amount in ₹ (optional) <input v-model="amount" autocomplete="off" inputmode="decimal" /></label>
    <label>Note (optional) <input v-model="note" autocomplete="off" /></label>
    <div class="builder__out" aria-live="polite">
      <p class="pg__label">{{ result.ok ? "upi:// link" : "Cannot build a link yet" }}</p>
      <pre class="code builder__link"><code>{{ result.ok ? result.value : result.message }}</code></pre>
      <div v-if="result.ok" class="builder__actions">
        <button class="btn" type="button" @click="copy">{{ copied ? "Copied" : "Copy link" }}</button>
        <a class="btn btn--quiet" :href="result.value">Open in a UPI app</a>
      </div>
    </div>
  </form>
</template>
