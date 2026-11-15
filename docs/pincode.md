---
module: pincode
title: Pincode
lede: Six digits. The first is one of nine postal zones, the first two a sub-zone, the first three a sorting district. bharat-kit reads all three from the number alone.
---

<script setup>
import { PIN_ZONES } from "bharat-kit";
</script>

## Try it {#try}

<Playground module="pincode" />

## Validate {#validate}

```ts
import { validatePincode } from "bharat-kit/pincode";

const result = validatePincode("560 001");
if (result.ok) save(result.value); // "560001"
```

## Format {#format}

```ts
validatePincode("400-001"); // { ok: true, value: "400001" }: spaces and hyphens removed
```

## Parse {#parse}

```ts
import { parsePincode } from "bharat-kit/pincode";

parsePincode("560001");
// { ok: true, value: { zone: 5, zoneRegion: "Andhra Pradesh, Telangana, Karnataka",
//   subZone: "56", circle: "Karnataka", sortingDistrict: "560" } }
```

## Zones {#zones}

<table>
  <thead><tr><th>First digit</th><th>Region</th></tr></thead>
  <tbody>
    <tr v-for="(region, zone) in PIN_ZONES" :key="zone"><td><code>{{ zone }}</code></td><td>{{ region }}</td></tr>
  </tbody>
</table>

## Functions {#functions}

<SpecTables module="pincode" part="functions" />

## Errors {#errors}

<SpecTables module="pincode" part="errors" />

## Limits {#limits}

- `circle` is a hint, not an address check. Some border pincodes are served by a neighbouring state's circle (403xxx is Goa inside the Maharashtra circle), and a few prefixes have no circle allocated.
- A well-formed pincode may have no post office. Checking that needs India Post's directory, which is several megabytes and changes often.

## Sources {#sources}

<SpecTables module="pincode" part="sources" />
