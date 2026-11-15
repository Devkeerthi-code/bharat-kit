<script setup lang="ts">
import GstinSpecimen from "./GstinSpecimen.vue";
import ModuleGrid from "./ModuleGrid.vue";
import MoneyWaterfall from "./MoneyWaterfall.vue";
import SentenceSearch from "./SentenceSearch.vue";
</script>

<template>
  <section id="specimen" class="hero wrap" aria-labelledby="hero-title">
    <div class="hero__intro">
      <p class="eyebrow">Specimen, volume 1 · nine formats</p>
      <h1 id="hero-title" class="hero__title">Indian data formats, <em>set as specimens.</em></h1>
      <p class="hero__note">
        bharat-kit is a small TypeScript library for GSTIN, PAN, IFSC, UPI IDs, mobile numbers, pincodes, Aadhaar,
        money in lakhs and crores, and vehicle numbers. No dependencies. Everything on this page is live. Type into it.
      </p>
    </div>
    <GstinSpecimen />
  </section>

  <section id="money" class="section wrap" aria-labelledby="money-title">
    <header class="sec-head">
      <p class="sec-head__num">02</p>
      <h2 id="money-title" class="sec-head__title">Waterfall: one amount, five settings</h2>
      <p class="sec-head__note">
        Edit the raw number, the grouped number or the short form. The others follow. Indian grouping puts a comma after
        the thousands, then after every two digits.
      </p>
    </header>
    <MoneyWaterfall />
  </section>

  <section id="modules" class="section wrap" aria-labelledby="modules-title">
    <header class="sec-head">
      <p class="sec-head__num">03</p>
      <h2 id="modules-title" class="sec-head__title">The set: nine modules</h2>
      <p class="sec-head__note">
        Each module is a separate import, so a form that only checks pincodes ships only the pincode code. All sample
        values are made up.
      </p>
    </header>
    <ModuleGrid />
  </section>

  <section id="find" class="section wrap" aria-labelledby="find-title">
    <header class="sec-head">
      <p class="sec-head__num">04</p>
      <h2 id="find-title" class="sec-head__title">Find the function you need</h2>
      <p class="sec-head__note">Change the underlined words, then press Show me. Each word is a normal dropdown, so Tab and the arrow keys work.</p>
    </header>
    <SentenceSearch />
  </section>
</template>
