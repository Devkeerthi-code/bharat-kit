<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { GST_STATE_CODES, gstinCheckDigit, isGstStateCode, validateGstin } from "bharat-kit";
import { flip, replay } from "../lib/motion";

const DEMO = "29ABCPE1234F1Z";

type Kind = "digit" | "letter" | "entity" | "z";
const SLOTS: readonly (readonly [Kind, string])[] = [
  ["digit", "state code"], ["digit", "state code"],
  ["letter", "PAN"], ["letter", "PAN"], ["letter", "PAN"], ["letter", "PAN"], ["letter", "PAN"],
  ["digit", "PAN"], ["digit", "PAN"], ["digit", "PAN"], ["digit", "PAN"], ["letter", "PAN"],
  ["entity", "entity number"], ["z", "default"],
];
const KIND_WORDS: Record<Kind, string> = { digit: "a digit", letter: "a letter", entity: "1–9 or A–Z", z: "Z" };
const ACCEPTS: Record<Kind, RegExp> = { digit: /^[0-9]$/, letter: /^[A-Z]$/, entity: /^[1-9A-Z]$/, z: /^Z$/ };

const GROUPS = [
  { part: "state", name: "State", from: 0, to: 2 },
  { part: "pan", name: "PAN", from: 2, to: 12 },
  { part: "entity", name: "Entity", from: 12, to: 13 },
  { part: "z", name: "Default", from: 13, to: 14 },
] as const;

const chars = ref<string[]>(DEMO.split(""));
const pinned = ref(false);
const hovering = ref(false);
const focused = ref(false);
const split = ref(false);
const root = ref<HTMLElement | null>(null);
const checkEl = ref<HTMLElement | null>(null);
const inputs = ref<HTMLInputElement[]>([]);

interface Problem { readonly index: number; readonly message: string }

const problem = computed<Problem | null>(() => {
  for (let i = 0; i < 14; i++) {
    const ch = chars.value[i] ?? "";
    const [kind, part] = SLOTS[i] as readonly [Kind, string];
    if (!ch) return { index: i, message: `Character ${i + 1} is empty (${part}).` };
    if (!ACCEPTS[kind].test(ch)) return { index: i, message: `Character ${i + 1} must be ${KIND_WORDS[kind]} (${part} part).` };
  }
  // Shape is right; let the library judge the state code and PAN holder type.
  const first14 = chars.value.join("");
  const result = validateGstin(first14 + String(gstinCheckDigit(first14)));
  return result.ok ? null : { index: result.index ?? 0, message: result.message };
});

const check = computed(() => (problem.value ? "?" : String(gstinCheckDigit(chars.value.join("")))));
const state = computed(() => {
  const code = chars.value.slice(0, 2).join("");
  return isGstStateCode(code) ? GST_STATE_CODES[code] : code.length === 2 ? "Unknown code" : "–";
});
const status = computed(() =>
  problem.value ? problem.value.message : `Well-formed. Check character ${check.value} is computed from the first 14.`,
);

function labelFor(part: string): string {
  if (part === "state") return state.value;
  if (part === "pan") return chars.value.slice(2, 12).join("") || "–";
  if (part === "entity") return chars.value[12] ? `No. ${chars.value[12]} under this PAN` : "–";
  return "Always Z";
}

watch(check, (now, before) => {
  if (now !== "?" && now !== before) void nextTick(() => replay(checkEl.value, "is-changed"));
});

function setSplit(on: boolean): void {
  if (split.value === on || !root.value) return;
  const groups = Array.from(root.value.querySelectorAll<HTMLElement>(".gst__group"));
  // The class is toggled by hand too, so FLIP can measure the new layout synchronously.
  flip(groups, () => {
    split.value = on;
    root.value?.classList.toggle("is-split", on);
  });
}

const finePointer = (): boolean => window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const settle = (): void => setSplit(pinned.value || hovering.value || focused.value);

function focusAt(index: number): void {
  inputs.value[Math.max(0, Math.min(13, index))]?.focus();
}

function fillFrom(index: number, text: string): void {
  const clean = text.toUpperCase().replace(/[^0-9A-Z]/g, "");
  const next = [...chars.value];
  let i = index;
  for (const ch of clean) {
    if (i > 13) break;
    next[i++] = ch;
  }
  chars.value = next;
  focusAt(i);
}

function onInput(index: number, event: Event): void {
  const input = event.target as HTMLInputElement;
  const e = event as InputEvent;
  // Typing over a filled cell replaces it rather than appending.
  const source = e.inputType === "insertText" && e.data ? e.data.slice(-1) : input.value;
  const typed = source.toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (typed.length > 1) return fillFrom(index, typed);
  const next = [...chars.value];
  next[index] = typed;
  chars.value = next;
  input.value = typed;
  if (typed && index < 13) focusAt(index + 1);
}

function onKeydown(index: number, event: KeyboardEvent): void {
  if (event.key === "Backspace" && !chars.value[index] && index > 0) {
    event.preventDefault();
    const next = [...chars.value];
    next[index - 1] = "";
    chars.value = next;
    focusAt(index - 1);
  } else if (event.key === "ArrowLeft" && index > 0) {
    event.preventDefault();
    focusAt(index - 1);
  } else if (event.key === "ArrowRight" && index < 13) {
    event.preventDefault();
    focusAt(index + 1);
  }
}

function onPaste(index: number, event: ClipboardEvent): void {
  event.preventDefault();
  fillFrom(index, event.clipboardData?.getData("text") ?? "");
}

function togglePinned(): void {
  pinned.value = !split.value;
  setSplit(pinned.value);
}

function reset(): void {
  chars.value = DEMO.split("");
  focusAt(0);
}

const onEnter = (): void => {
  if (finePointer()) {
    hovering.value = true;
    settle();
  }
};
const onLeave = (): void => {
  hovering.value = false;
  settle();
};
const onFocusIn = (): void => {
  focused.value = true;
  settle();
};
const onFocusOut = (): void => {
  requestAnimationFrame(() => {
    focused.value = Boolean(root.value?.contains(document.activeElement));
    settle();
  });
};

function inputMode(index: number): "numeric" | "text" {
  return (SLOTS[index] as readonly [Kind, string])[0] === "digit" ? "numeric" : "text";
}
</script>

<template>
  <figure class="specimen">
    <figcaption class="specimen__caption">
      <span>GSTIN</span>
      <span>15 characters</span>
      <span>1 computed check character</span>
      <span class="specimen__demo">Demo value, not a real registration</span>
    </figcaption>

    <div
      ref="root"
      class="gst"
      :class="{ 'is-invalid': problem, 'is-split': split }"
      role="group"
      aria-label="Editable GSTIN specimen. The last character is computed."
      @pointerenter="onEnter"
      @pointerleave="onLeave"
      @focusin="onFocusIn"
      @focusout="onFocusOut"
    >
      <div v-for="group in GROUPS" :key="group.part" class="gst__group" :data-part="group.part">
        <div class="gst__chars">
          <input
            v-for="i in group.to - group.from"
            :key="group.from + i - 1"
            :ref="(el) => { if (el) inputs[group.from + i - 1] = el as HTMLInputElement }"
            class="gst__char"
            :value="chars[group.from + i - 1]"
            :aria-label="`Character ${group.from + i} of 15, ${SLOTS[group.from + i - 1]?.[1]}`"
            :aria-invalid="problem?.index === group.from + i - 1"
            :inputmode="inputMode(group.from + i - 1)"
            maxlength="2"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            enterkeyhint="next"
            @focus="($event.target as HTMLInputElement).select()"
            @input="onInput(group.from + i - 1, $event)"
            @keydown="onKeydown(group.from + i - 1, $event)"
            @paste="onPaste(group.from + i - 1, $event)"
          />
        </div>
        <p class="gst__label">
          <span class="gst__label-name">{{ group.name }}</span><span>{{ labelFor(group.part) }}</span>
        </p>
      </div>
      <div class="gst__group" data-part="check">
        <div class="gst__chars">
          <output ref="checkEl" class="gst__char gst__char--check" aria-label="Character 15, computed check character">{{ check }}</output>
        </div>
        <p class="gst__label">
          <span class="gst__label-name">Check</span><span>{{ problem ? "Needs a valid prefix" : "Computed, mod 36" }}</span>
        </p>
      </div>
    </div>

    <div class="specimen__foot">
      <p class="status" :data-state="problem ? 'invalid' : 'valid'" aria-live="polite">{{ status }}</p>
      <div class="specimen__actions">
        <button class="btn" type="button" :aria-pressed="split" @click="togglePinned">{{ split ? "Join the parts" : "Split into parts" }}</button>
        <button class="btn btn--quiet" type="button" @click="reset">Reset</button>
      </div>
    </div>
  </figure>
</template>
