<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { withBase } from "vitepress";
import { MODULES, USAGE_NOTES, type ModuleInfo, type Usage, type Verb } from "../data/modules";
import { highlight } from "../lib/highlight";
import { prefersReducedMotion, replay } from "../lib/motion";

const VERBS: readonly Verb[] = ["validate", "format", "parse"];
const USAGES: readonly Usage[] = ["forms", "invoices", "payments"];

const verb = ref<Verb>("validate");
const slug = ref("gstin");
const usage = ref<Usage>("forms");
const found = ref<{ slug: string; verb: Verb; usage: Usage } | null>(null);
const announcement = ref("");
const selects = ref<HTMLSelectElement[]>([]);
const probe = ref<HTMLSpanElement | null>(null);

const chosen = computed(() => MODULES.find((m) => m.slug === slug.value) ?? (MODULES[0] as ModuleInfo));

function snippet(m: ModuleInfo, v: Verb, u: Usage): string {
  return `import { ${m.imports} } from "bharat-kit"\n\n${USAGE_NOTES[u]}\n${m.snippets[v]}`;
}

function exampleFor(m: ModuleInfo): { code: string; caption: string; verb: Verb } {
  const pick = found.value?.slug === m.slug ? found.value : { verb: "validate" as Verb, usage: "forms" as Usage };
  return { code: highlight(snippet(m, pick.verb, pick.usage)), caption: `${pick.verb} · ${pick.usage}`, verb: pick.verb };
}

/** Native selects keep keyboard and screen-reader behaviour; this only sizes each one to its word. */
function fit(select: HTMLSelectElement | undefined): void {
  if (!select || !probe.value) return;
  probe.value.textContent = select.options[select.selectedIndex]?.text ?? "";
  select.style.width = `${Math.ceil(probe.value.getBoundingClientRect().width) + 28}px`;
}

function fitAll(): void {
  selects.value.forEach(fit);
}

onMounted(() => {
  fitAll();
  void document.fonts?.ready.then(fitAll);
});

async function show(): Promise<void> {
  found.value = { slug: slug.value, verb: verb.value, usage: usage.value };
  await nextTick();
  const target = document.getElementById(`ex-${slug.value}`) as HTMLDetailsElement | null;
  if (!target) return;
  document.querySelectorAll<HTMLDetailsElement>(".examples details").forEach((d) => (d.open = d === target));
  replay(target, "is-found");
  history.replaceState(null, "", `#ex-${slug.value}`);
  target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  target.querySelector("summary")?.focus({ preventScroll: true });
  announcement.value = `Showing how to ${verb.value} ${chosen.value.article} ${chosen.value.noun} for ${usage.value}.`;
}
</script>

<template>
  <form class="sentence" @submit.prevent="show">
    <span ref="probe" class="sentence__probe" aria-hidden="true"></span>
    <p class="sentence__line">
      I want to
      <label class="sr-only" for="find-verb">Action</label>
      <span class="pick"><select id="find-verb" :ref="(el) => { if (el) selects[0] = el as HTMLSelectElement }" v-model="verb" class="sentence__select" @change="fitAll">
        <option v-for="v in VERBS" :key="v" :value="v">{{ v }}</option>
      </select></span>
      {{ chosen.article }}
      <label class="sr-only" for="find-module">Data type</label>
      <span class="pick"><select id="find-module" :ref="(el) => { if (el) selects[1] = el as HTMLSelectElement }" v-model="slug" class="sentence__select" @change="fitAll">
        <option v-for="m in MODULES" :key="m.slug" :value="m.slug">{{ m.noun }}</option>
      </select></span>
      for
      <label class="sr-only" for="find-usage">Used in</label>
      <span class="pick"><select id="find-usage" :ref="(el) => { if (el) selects[2] = el as HTMLSelectElement }" v-model="usage" class="sentence__select" @change="fitAll">
        <option v-for="u in USAGES" :key="u" :value="u">{{ u }}</option>
      </select></span><span class="sentence__stop">.</span>
      <button class="btn btn--ink sentence__go" type="submit">Show me</button>
    </p>
    <p class="sr-only" aria-live="polite">{{ announcement }}</p>
  </form>

  <div class="examples" aria-label="Examples by module">
    <details v-for="m in MODULES" :id="`ex-${m.slug}`" :key="m.slug">
      <summary>
        <span class="examples__name">{{ m.noun.charAt(0).toUpperCase() + m.noun.slice(1) }}</span>
        <span class="examples__cap">{{ exampleFor(m).caption }}</span>
      </summary>
      <pre class="code"><code v-html="exampleFor(m).code"></code></pre>
      <a class="roll examples__more" :href="withBase(`/${m.slug}#${exampleFor(m).verb}`)"><span :data-text="`Full ${m.name} page`">Full {{ m.name }} page</span></a>
    </details>
  </div>
</template>
