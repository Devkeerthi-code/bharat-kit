---
module: gstin
title: GSTIN
lede: A GST registration number is 15 characters in five parts. bharat-kit checks every part and recomputes the check digit, so a single mistyped character is caught before it reaches an invoice.
---

<script setup>
import { GST_STATE_CODES, LEGACY_GST_STATE_CODES } from "bharat-kit";
const states = Object.entries(GST_STATE_CODES).sort(([a], [b]) => a.localeCompare(b));
</script>

## Try it {#try}

<Playground module="gstin" />

## Anatomy {#anatomy}

| Characters | Part | Rule |
| --- | --- | --- |
| 1–2 | State code | One of the GST state codes below |
| 3–12 | PAN | The holder's PAN: 5 letters, 4 digits, 1 letter; 4th letter is a holder type |
| 13 | Entity number | 1–9, then A–Z, for several registrations under one PAN in one state |
| 14 | Default | `Z` for regular taxpayers |
| 15 | Check digit | Luhn mod 36 over the first 14 |

## Validate {#validate}

```ts
import { validateGstin } from "bharat-kit/gstin";

const result = validateGstin(form.gstin);
if (!result.ok) {
  // result.reason is stable: switch on it. result.message is ready to show.
  return showFieldError("gstin", result.message);
}
save(result.value); // normalised: upper case, no spaces
```

## Format {#format}

Build a GSTIN from its parts and let the library compute the check digit:

```ts
import { formatGstin } from "bharat-kit/gstin";

formatGstin({ stateCode: "29", pan: "ABCPE1234F", entityNumber: "1" });
// "29ABCPE1234F1Z7"
```

## Parse {#parse}

```ts
import { parseGstin } from "bharat-kit/gstin";

const parsed = parseGstin("29abcpe1234f1z7");
if (parsed.ok) {
  parsed.value.stateName;     // "Karnataka"
  parsed.value.pan;           // "ABCPE1234F"
  parsed.value.panHolderType; // "P" (individual)
}
```

### How the check digit works

Map each of the first 14 characters to 0–35 (`0`–`9`, then `A`–`Z`). Multiply them by 1, 2, 1, 2… from the left. For each product, add its quotient and remainder when divided by 36. The check character is `(36 − sum mod 36) mod 36`, mapped back to a character. This reproduces the sample GSTIN `27AAPFU0939F1ZV` printed in GST documentation.

## Functions {#functions}

<SpecTables module="gstin" part="functions" />

## Errors {#errors}

<SpecTables module="gstin" part="errors" />

## State codes {#states}

Codes 25 and 28 are legacy. Daman and Diu (25) merged into 26 in 2020, and 28 was Andhra Pradesh before 2014. They still validate because old registrations carry them, and `parseGstin` sets `legacyStateCode: true`.

<table>
  <thead><tr><th>Code</th><th>State or territory</th></tr></thead>
  <tbody>
    <tr v-for="[code, name] in states" :key="code">
      <td><code>{{ code }}</code></td>
      <td>{{ name }}{{ LEGACY_GST_STATE_CODES.includes(code) ? " (legacy)" : "" }}</td>
    </tr>
  </tbody>
</table>

## Limits {#limits}

- Validates regular taxpayer GSTINs. Special registrations such as TDS deductors, TCS collectors, UIN holders and non-resident taxpayers use other patterns and are rejected.
- A valid GSTIN is well-formed, not necessarily registered or active. Use the GST portal's taxpayer search for that.

## Sources {#sources}

<SpecTables module="gstin" part="sources" />
