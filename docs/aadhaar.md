---
module: aadhaar
title: Aadhaar
lede: Checksum and masking, nothing else. The functions are pure, keep nothing, log nothing, and their error messages never repeat the number. That makes the results safe to log or show.
---

## Try it {#try}

<Playground module="aadhaar" />

## Privacy first {#privacy}

> An Aadhaar number is sensitive personal data. The Aadhaar Act and UIDAI's rules limit who may collect it and say it must be stored securely. Usually the right answer is not to store it at all. Validate, mask, and keep only the masked form.

What bharat-kit does to help:

- Pure functions. Nothing is kept between calls, and nothing is written to the console. `no-console` is a lint error in this codebase.
- `reason` and `message` never contain the input or any part of it. A test checks this for random numbers.
- `maskAadhaar` works on any 12-digit input, so you can mask before you validate and never hold the full number in a variable longer than you must.

What it can't do: tell you whether a number was issued. A passing checksum means "no typo", not "real".

## Validate {#validate}

```ts
import { validateAadhaar, maskAadhaar } from "bharat-kit/aadhaar";

const result = validateAadhaar(input);
if (!result.ok) return showFieldError("aadhaar", result.message);
const masked = maskAadhaar(result.value); // keep only this
```

## Format {#format}

```ts
maskAadhaar("2345 6789 0124");                    // { ok: true, value: "XXXX XXXX 0124" }
maskAadhaar("2345 6789 0124", { maskChar: "•" }); // "•••• •••• 0124"
```

## Parse {#parse}

An Aadhaar number has no public structure to parse. The first 11 digits carry no meaning you can read, and the 12th is a Verhoeff check digit. For other uses of Verhoeff, call the algorithm directly:

```ts
import { verhoeffCheckDigit, verhoeffValidate } from "bharat-kit/aadhaar";

verhoeffCheckDigit("236"); // 3
verhoeffValidate("2363");  // true
```

## Functions {#functions}

<SpecTables module="aadhaar" part="functions" />

## Errors {#errors}

<SpecTables module="aadhaar" part="errors" />

## Sources {#sources}

<SpecTables module="aadhaar" part="sources" />
